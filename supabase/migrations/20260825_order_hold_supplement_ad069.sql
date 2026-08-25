-- AD-069: 주문 보류(on_hold) · 보완 제출 · 점주 취소/거절 사유 · 알림

-- ── 1) orders 확장 ──
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS hold_reason_code character varying(40),
  ADD COLUMN IF NOT EXISTS hold_reason_text text,
  ADD COLUMN IF NOT EXISTS hold_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS hold_affected_item_ids uuid[],
  ADD COLUMN IF NOT EXISTS supplement_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason_code character varying(40),
  ADD COLUMN IF NOT EXISTS reject_reason_text text;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending', 'paid', 'awaiting_accept', 'on_hold', 'accepted', 'rejected',
    'shipped', 'delivery_completed', 'purchase_confirmed', 'completed', 'cancelled'
  )
);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_hold_reason_code_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_hold_reason_code_check CHECK (
  hold_reason_code IS NULL OR hold_reason_code IN (
    'address_issue', 'line_stock_short', 'gacha_prize_oos', 'other'
  )
);

-- ── 2) 점주 사유 템플릿 (커스텀 라벨) ──
CREATE TABLE IF NOT EXISTS public.store_order_reason_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id character varying NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_kind character varying(10) NOT NULL,
  reason_code character varying(40) NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_order_reason_templates_kind_check CHECK (template_kind IN ('hold', 'reject')),
  CONSTRAINT store_order_reason_templates_code_check CHECK (
    reason_code IN ('address_issue', 'line_stock_short', 'gacha_prize_oos', 'other', 'policy_violation', 'cannot_fulfill')
  )
);

CREATE INDEX IF NOT EXISTS store_order_reason_templates_store_idx
  ON public.store_order_reason_templates(store_id, template_kind);

ALTER TABLE public.store_order_reason_templates
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.store_order_reason_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_order_reason_templates_owner ON public.store_order_reason_templates;
CREATE POLICY store_order_reason_templates_owner ON public.store_order_reason_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  );

-- ── 3) 앱 내 알림 + 푸시 토큰 ──
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  event_type character varying(40) NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_notifications_user_created_idx
  ON public.order_notifications(user_id, created_at DESC);

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_notifications_select_own ON public.order_notifications;
CREATE POLICY order_notifications_select_own ON public.order_notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS order_notifications_update_own ON public.order_notifications;
CREATE POLICY order_notifications_update_own ON public.order_notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_push_tokens_own ON public.user_push_tokens;
CREATE POLICY user_push_tokens_own ON public.user_push_tokens
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
  END IF;
END $$;

-- ── 4) helpers ──
CREATE OR REPLACE FUNCTION public._restore_gacha_roll(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM public.gacha_rolls gr WHERE gr.order_id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public._recalculate_order_totals(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_fee_type character varying;
  v_fee_amount integer;
  v_free_threshold integer;
  v_discounted_subtotal integer;
  v_shipping_fee integer;
  v_final_total integer;
BEGIN
  SELECT o.store_id INTO v_store_id FROM public.orders o WHERE o.id = p_order_id;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  SELECT s.shipping_fee_type, s.shipping_fee_amount, s.shipping_free_threshold
  INTO v_fee_type, v_fee_amount, v_free_threshold
  FROM public.stores s WHERE s.id = v_store_id;

  SELECT COALESCE(SUM(
    ROUND(oi.unit_price * oi.quantity * (100 - COALESCE(oi.line_discount_percent, 0)) / 100.0)
  ), 0)::integer
  INTO v_discounted_subtotal
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;

  IF v_discounted_subtotal <= 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  v_shipping_fee := public.calc_store_shipping_fee(
    v_fee_type, v_fee_amount, v_free_threshold, v_discounted_subtotal
  );
  v_final_total := v_discounted_subtotal + v_shipping_fee;

  UPDATE public.orders o
  SET subtotal_amount = v_discounted_subtotal,
      shipping_fee = v_shipping_fee,
      total_amount = v_final_total
  WHERE o.id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public._enqueue_order_notification(
  p_user_id uuid,
  p_order_id uuid,
  p_event_type text,
  p_title text,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.order_notifications (user_id, order_id, event_type, title, body)
  VALUES (p_user_id, p_order_id, p_event_type, p_title, p_body);
END;
$function$;

-- ── 5) hold_order ──
CREATE OR REPLACE FUNCTION public.hold_order(
  p_order_id uuid,
  p_reason_code character varying,
  p_reason_memo text DEFAULT NULL,
  p_affected_item_ids uuid[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_user_id uuid;
  v_status character varying;
  v_order_number integer;
  v_store_code character varying;
  v_memo text := NULLIF(trim(p_reason_memo), '');
BEGIN
  SELECT o.store_id, o.user_id, o.status, o.order_number, st.store_code
  INTO v_store_id, v_user_id, v_status, v_order_number, v_store_code
  FROM public.orders o
  JOIN public.stores st ON st.id = o.store_id
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_status NOT IN ('awaiting_accept', 'accepted') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL) THEN
    RAISE EXCEPTION 'already_shipped';
  END IF;

  IF p_reason_code NOT IN ('address_issue', 'line_stock_short', 'gacha_prize_oos', 'other') THEN
    RAISE EXCEPTION 'invalid_reason_code';
  END IF;

  IF p_reason_code = 'line_stock_short' THEN
    IF p_affected_item_ids IS NULL OR cardinality(p_affected_item_ids) = 0 THEN
      RAISE EXCEPTION 'affected_items_required';
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(p_affected_item_ids) AS aid(id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.order_items oi
        WHERE oi.id = aid.id AND oi.order_id = p_order_id
      )
    ) THEN
      RAISE EXCEPTION 'invalid_affected_items';
    END IF;
  END IF;

  IF p_reason_code = 'other' AND v_memo IS NULL THEN
    RAISE EXCEPTION 'memo_required';
  END IF;

  UPDATE public.orders o
  SET status = 'on_hold',
      hold_reason_code = p_reason_code,
      hold_reason_text = v_memo,
      hold_requested_at = now(),
      hold_affected_item_ids = p_affected_item_ids,
      supplement_submitted_at = NULL,
      accepted_at = NULL
  WHERE o.id = p_order_id;

  PERFORM public._enqueue_order_notification(
    v_user_id,
    p_order_id,
    'order_on_hold',
    '주문 수정 요청',
    format('주문 %s-%s 수정이 필요해요. 앱에서 확인해 주세요.', v_store_code, v_order_number)
  );
END;
$function$;

-- ── 6) submit_order_supplement ──
CREATE OR REPLACE FUNCTION public.submit_order_supplement(
  p_order_id uuid,
  p_payload jsonb
)
RETURNS TABLE(needs_gacha_roll boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_store_id character varying;
  v_status character varying;
  v_reason character varying;
  v_affected uuid[];
  v_address_id uuid;
  v_gacha_action text;
  v_item jsonb;
  v_item_id uuid;
  v_new_qty integer;
  v_old_qty integer;
  v_product_id uuid;
  v_owner_id uuid;
  v_order_number integer;
  v_store_code character varying;
  v_needs_roll boolean := false;
BEGIN
  SELECT o.user_id, o.store_id, o.status, o.hold_reason_code, o.hold_affected_item_ids,
         o.order_number, st.store_code
  INTO v_user_id, v_store_id, v_status, v_reason, v_affected, v_order_number, v_store_code
  FROM public.orders o
  JOIN public.stores st ON st.id = o.store_id
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_status <> 'on_hold' THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  SELECT s.owner_id INTO v_owner_id FROM public.stores s WHERE s.id = v_store_id;

  IF v_reason = 'address_issue' THEN
    v_address_id := (p_payload->>'address_id')::uuid;
    IF v_address_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.user_addresses ua
      WHERE ua.id = v_address_id AND ua.user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'invalid_address';
    END IF;
    UPDATE public.orders o SET shipping_address_id = v_address_id WHERE o.id = p_order_id;

  ELSIF v_reason = 'line_stock_short' THEN
    IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
      RAISE EXCEPTION 'items_required';
    END IF;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
    LOOP
      v_item_id := (v_item->>'item_id')::uuid;
      v_new_qty := GREATEST(0, COALESCE((v_item->>'quantity')::integer, 0));
      IF NOT (v_item_id = ANY (v_affected)) THEN
        RAISE EXCEPTION 'item_not_affected';
      END IF;
      SELECT oi.quantity, oi.product_id INTO v_old_qty, v_product_id
      FROM public.order_items oi
      WHERE oi.id = v_item_id AND oi.order_id = p_order_id;
      IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'invalid_item';
      END IF;
      IF v_new_qty >= v_old_qty THEN
        RAISE EXCEPTION 'quantity_must_decrease';
      END IF;
      IF v_new_qty = 0 THEN
        UPDATE public.products p
        SET stock_quantity = p.stock_quantity + v_old_qty, updated_at = now()
        WHERE p.id = v_product_id;
        DELETE FROM public.order_items oi WHERE oi.id = v_item_id;
      ELSE
        UPDATE public.products p
        SET stock_quantity = p.stock_quantity + (v_old_qty - v_new_qty), updated_at = now()
        WHERE p.id = v_product_id;
        UPDATE public.order_items oi SET quantity = v_new_qty WHERE oi.id = v_item_id;
      END IF;
    END LOOP;
    PERFORM public._recalculate_order_totals(p_order_id);

  ELSIF v_reason = 'gacha_prize_oos' THEN
    v_gacha_action := p_payload->>'gacha_action';
    IF v_gacha_action NOT IN ('reroll', 'forfeit') THEN
      RAISE EXCEPTION 'invalid_gacha_action';
    END IF;
    PERFORM public._restore_gacha_roll(p_order_id);
    v_needs_roll := (v_gacha_action = 'reroll');

  ELSIF v_reason = 'other' THEN
    RAISE EXCEPTION 'supplement_not_allowed';
  ELSE
    RAISE EXCEPTION 'invalid_reason_code';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = p_order_id) THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  UPDATE public.orders o
  SET status = 'awaiting_accept',
      supplement_submitted_at = now(),
      hold_reason_code = NULL,
      hold_reason_text = NULL,
      hold_requested_at = NULL,
      hold_affected_item_ids = NULL
  WHERE o.id = p_order_id;

  PERFORM public._enqueue_order_notification(
    v_owner_id,
    p_order_id,
    'order_supplement_submitted',
    '수정 주문 접수',
    format('주문 %s-%s 수정이 접수됐어요. 확인해 주세요.', v_store_code, v_order_number)
  );

  RETURN QUERY SELECT v_needs_roll;
END;
$function$;

-- ── 7) reject_order (사유 추가) ──
DROP FUNCTION IF EXISTS public.reject_order(uuid);

CREATE OR REPLACE FUNCTION public.reject_order(
  p_order_id uuid,
  p_reason_code character varying DEFAULT NULL,
  p_reason_memo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_user_id uuid;
  v_status character varying;
  v_auto boolean;
  v_order_number integer;
  v_store_code character varying;
  v_memo text := NULLIF(trim(p_reason_memo), '');
BEGIN
  SELECT o.store_id, o.user_id, o.status, o.auto_accepted, o.order_number, st.store_code
  INTO v_store_id, v_user_id, v_status, v_auto, v_order_number, v_store_code
  FROM public.orders o
  JOIN public.stores st ON st.id = o.store_id
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_status NOT IN ('awaiting_accept', 'accepted', 'on_hold') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  IF v_status = 'accepted' AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'already_shipped';
  END IF;

  IF p_reason_code IS NOT NULL AND p_reason_code NOT IN (
    'line_stock_short', 'gacha_prize_oos', 'address_issue', 'policy_violation', 'cannot_fulfill', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_reason_code';
  END IF;

  PERFORM public._restore_order_stock(p_order_id);
  PERFORM public._restore_gacha_roll(p_order_id);

  IF v_auto THEN
    PERFORM public._restore_auto_accept_quota(p_order_id);
  END IF;

  UPDATE public.orders o
  SET status = 'rejected',
      reject_reason_code = p_reason_code,
      reject_reason_text = v_memo,
      hold_reason_code = NULL,
      hold_reason_text = NULL,
      hold_requested_at = NULL,
      hold_affected_item_ids = NULL
  WHERE o.id = p_order_id;

  PERFORM public._enqueue_order_notification(
    v_user_id,
    p_order_id,
    'order_rejected',
    '주문 취소 안내',
    format(
      '주문 %s-%s이 취소됐어요.%s',
      v_store_code,
      v_order_number,
      CASE WHEN v_memo IS NOT NULL THEN ' 사유: ' || v_memo ELSE '' END
    )
  );
END;
$function$;

-- ── 8) cancel_order_by_shopper — on_hold 허용 + 가챠 원복 ──
CREATE OR REPLACE FUNCTION public.cancel_order_by_shopper(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_status character varying;
  v_auto boolean;
  v_owner_id uuid;
  v_store_id character varying;
  v_order_number integer;
  v_store_code character varying;
BEGIN
  SELECT o.user_id, o.status, o.auto_accepted, o.store_id, o.order_number, st.store_code
  INTO v_user_id, v_status, v_auto, v_store_id, v_order_number, v_store_code
  FROM public.orders o
  JOIN public.stores st ON st.id = o.store_id
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_status NOT IN ('awaiting_accept', 'accepted', 'on_hold') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL) THEN
    RAISE EXCEPTION 'already_shipped';
  END IF;

  PERFORM public._restore_order_stock(p_order_id);
  PERFORM public._restore_gacha_roll(p_order_id);

  IF v_auto THEN
    PERFORM public._restore_auto_accept_quota(p_order_id);
  END IF;

  UPDATE public.orders o
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = 'shopper',
      hold_reason_code = NULL,
      hold_reason_text = NULL,
      hold_requested_at = NULL,
      hold_affected_item_ids = NULL
  WHERE o.id = p_order_id;

  SELECT s.owner_id INTO v_owner_id FROM public.stores s WHERE s.id = v_store_id;

  PERFORM public._enqueue_order_notification(
    v_owner_id,
    p_order_id,
    'order_cancelled_by_shopper',
    '주문 취소',
    format('주문 %s-%s을 고객이 취소했어요.', v_store_code, v_order_number)
  );
END;
$function$;

-- ── 9) push token ──
CREATE OR REPLACE FUNCTION public.register_push_token(p_expo_push_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_expo_push_token IS NULL OR length(trim(p_expo_push_token)) = 0 THEN
    RAISE EXCEPTION 'empty_token';
  END IF;
  INSERT INTO public.user_push_tokens (user_id, expo_push_token, updated_at)
  VALUES (auth.uid(), trim(p_expo_push_token), now())
  ON CONFLICT (user_id) DO UPDATE
  SET expo_push_token = EXCLUDED.expo_push_token,
      updated_at = now();
END;
$function$;

-- ── 10) reason templates CRUD helpers ──
CREATE OR REPLACE FUNCTION public.list_store_reason_templates(
  p_store_id character varying,
  p_kind character varying
)
RETURNS TABLE(
  id uuid,
  reason_code character varying,
  label text,
  sort_order integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_kind NOT IN ('hold', 'reject') THEN
    RAISE EXCEPTION 'invalid_kind';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;
  RETURN QUERY
  SELECT t.id, t.reason_code, t.label, t.sort_order
  FROM public.store_order_reason_templates t
  WHERE t.store_id = p_store_id
    AND t.template_kind = p_kind
    AND t.is_active = true
  ORDER BY t.sort_order, t.created_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_store_reason_template(
  p_store_id character varying,
  p_kind character varying,
  p_reason_code character varying,
  p_label text,
  p_template_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id uuid;
  v_label text := trim(p_label);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;
  IF v_label IS NULL OR length(v_label) = 0 THEN
    RAISE EXCEPTION 'empty_label';
  END IF;
  IF p_template_id IS NULL THEN
    INSERT INTO public.store_order_reason_templates (store_id, template_kind, reason_code, label)
    VALUES (p_store_id, p_kind, p_reason_code, v_label)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.store_order_reason_templates t
    SET label = v_label, reason_code = p_reason_code, updated_at = now()
    WHERE t.id = p_template_id AND t.store_id = p_store_id
    RETURNING t.id INTO v_id;
  END IF;
  RETURN v_id;
END;
$function$;

-- ── 11) get_store_order_counts ──
DROP FUNCTION IF EXISTS public.get_store_order_counts(character varying);

CREATE OR REPLACE FUNCTION public.get_store_order_counts(p_store_id character varying)
RETURNS TABLE(
  pending_accept integer,
  awaiting_ship integer,
  on_hold integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (
      WHERE o.status IN ('awaiting_accept', 'pending', 'paid')
    )::integer AS pending_accept,
    COUNT(*) FILTER (
      WHERE o.status = 'accepted'
    )::integer AS awaiting_ship,
    COUNT(*) FILTER (
      WHERE o.status = 'on_hold'
    )::integer AS on_hold
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND o.status NOT IN ('rejected', 'cancelled');
END;
$function$;

-- ── 12) get_store_orders / get_my_orders — hold·reject·address_id ──
DROP FUNCTION IF EXISTS public.get_store_orders(character varying);

CREATE FUNCTION public.get_store_orders(p_store_id character varying)
RETURNS TABLE(
  order_id uuid,
  order_number integer,
  store_code character varying,
  total_amount integer,
  subtotal_amount integer,
  shipping_fee integer,
  discount_percent integer,
  reward_type character varying,
  status character varying,
  auto_accepted boolean,
  accepted_at timestamptz,
  tracking_number character varying,
  shipped_at timestamptz,
  delivery_completed_at timestamptz,
  purchase_confirmed_at timestamptz,
  purchase_confirm_auto boolean,
  cancelled_at timestamptz,
  cancelled_by character varying,
  claim_status character varying,
  claim_message text,
  claim_reply text,
  claim_created_at timestamptz,
  claim_resolved_at timestamptz,
  hold_reason_code character varying,
  hold_reason_text text,
  hold_requested_at timestamptz,
  hold_affected_item_ids uuid[],
  supplement_submitted_at timestamptz,
  reject_reason_code character varying,
  reject_reason_text text,
  shipping_address_id uuid,
  created_at timestamptz,
  buyer_nickname character varying,
  shipping_label character varying,
  shipping_recipient_name character varying,
  shipping_phone character varying,
  shipping_postal_code character varying,
  shipping_address_line1 character varying,
  shipping_address_line2 character varying,
  item_id uuid,
  product_id uuid,
  product_name character varying,
  quantity integer,
  unit_price integer,
  gacha_product_name character varying,
  gacha_exclusive_name character varying,
  gacha_product_image_url text,
  gacha_exclusive_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  RETURN QUERY
  SELECT
    o.id, o.order_number, st.store_code,
    o.total_amount, COALESCE(o.subtotal_amount, o.total_amount), COALESCE(o.shipping_fee, 0),
    o.discount_percent, o.reward_type, o.status, o.auto_accepted, o.accepted_at,
    o.tracking_number, o.shipped_at, o.delivery_completed_at, o.purchase_confirmed_at, o.purchase_confirm_auto,
    o.cancelled_at, o.cancelled_by,
    o.claim_status, o.claim_message, o.claim_reply, o.claim_created_at, o.claim_resolved_at,
    o.hold_reason_code, o.hold_reason_text, o.hold_requested_at, o.hold_affected_item_ids, o.supplement_submitted_at,
    o.reject_reason_code, o.reject_reason_text, o.shipping_address_id,
    o.created_at,
    prf.nickname, ua.label, ua.recipient_name, ua.phone, ua.postal_code, ua.address_line1, ua.address_line2,
    oi.id, oi.product_id, pr.name, oi.quantity, oi.unit_price,
    gp.name, ge.exclusive_name, gp.image_url, ge.exclusive_image_url
  FROM public.orders o
  JOIN public.stores st ON st.id = o.store_id
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.profiles prf ON prf.id = o.user_id
  LEFT JOIN public.user_addresses ua ON ua.id = o.shipping_address_id
  LEFT JOIN public.gacha_rolls gr ON gr.order_id = o.id
  LEFT JOIN public.gacha_pool_entries ge ON ge.id = gr.pool_entry_id
  LEFT JOIN public.products gp ON gp.id = ge.product_id
  WHERE o.store_id = p_store_id AND o.status <> 'rejected'
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_my_orders();

CREATE FUNCTION public.get_my_orders()
RETURNS TABLE(
  order_id uuid,
  order_number integer,
  store_id character varying,
  store_code character varying,
  store_name character varying,
  total_amount integer,
  subtotal_amount integer,
  shipping_fee integer,
  discount_percent integer,
  reward_type character varying,
  status character varying,
  auto_accepted boolean,
  accepted_at timestamptz,
  tracking_number character varying,
  shipped_at timestamptz,
  delivery_completed_at timestamptz,
  purchase_confirmed_at timestamptz,
  purchase_confirm_auto boolean,
  cancelled_at timestamptz,
  cancelled_by character varying,
  claim_status character varying,
  claim_message text,
  claim_reply text,
  claim_created_at timestamptz,
  claim_resolved_at timestamptz,
  hold_reason_code character varying,
  hold_reason_text text,
  hold_requested_at timestamptz,
  hold_affected_item_ids uuid[],
  supplement_submitted_at timestamptz,
  reject_reason_code character varying,
  reject_reason_text text,
  shipping_address_id uuid,
  created_at timestamptz,
  shipping_recipient_name character varying,
  shipping_phone character varying,
  shipping_postal_code character varying,
  shipping_address_line1 character varying,
  shipping_address_line2 character varying,
  item_id uuid,
  product_id uuid,
  product_name character varying,
  product_image_url text,
  quantity integer,
  unit_price integer,
  gacha_product_name character varying,
  gacha_exclusive_name character varying,
  gacha_product_image_url text,
  gacha_exclusive_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  RETURN QUERY
  SELECT
    o.id, o.order_number, o.store_id, st.store_code, st.name,
    o.total_amount, COALESCE(o.subtotal_amount, o.total_amount), COALESCE(o.shipping_fee, 0),
    o.discount_percent, o.reward_type, o.status, o.auto_accepted, o.accepted_at,
    o.tracking_number, o.shipped_at, o.delivery_completed_at, o.purchase_confirmed_at, o.purchase_confirm_auto,
    o.cancelled_at, o.cancelled_by,
    o.claim_status, o.claim_message, o.claim_reply, o.claim_created_at, o.claim_resolved_at,
    o.hold_reason_code, o.hold_reason_text, o.hold_requested_at, o.hold_affected_item_ids, o.supplement_submitted_at,
    o.reject_reason_code, o.reject_reason_text, o.shipping_address_id,
    o.created_at,
    ua.recipient_name, ua.phone, ua.postal_code, ua.address_line1, ua.address_line2,
    oi.id, oi.product_id, pr.name, pr.image_url, oi.quantity, oi.unit_price,
    gp.name, ge.exclusive_name, gp.image_url, ge.exclusive_image_url
  FROM public.orders o
  JOIN public.stores st ON st.id = o.store_id
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.user_addresses ua ON ua.id = o.shipping_address_id
  LEFT JOIN public.gacha_rolls gr ON gr.order_id = o.id
  LEFT JOIN public.gacha_pool_entries ge ON ge.id = gr.pool_entry_id
  LEFT JOIN public.products gp ON gp.id = ge.product_id
  WHERE o.user_id = auth.uid()
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;

-- ── grants ──
REVOKE ALL ON FUNCTION public.hold_order(uuid, character varying, text, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_order_supplement(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_push_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_store_reason_templates(character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_store_reason_template(character varying, character varying, character varying, text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.hold_order(uuid, character varying, text, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order_supplement(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_push_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_store_reason_templates(character varying, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_store_reason_template(character varying, character varying, character varying, text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_order(uuid, character varying, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_order(uuid, character varying, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_store_orders(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_orders(character varying) TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;

REVOKE ALL ON FUNCTION public.get_store_order_counts(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_order_counts(character varying) TO authenticated;
