-- AD-073 R2 — order_returns · 반품·교환 신청 · 점주 정책 컬럼

-- ── 1) 점주 반품·교환 정책 (§7.49) ──
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS return_change_of_mind_allowed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_change_of_mind_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS exchange_allowed boolean NOT NULL DEFAULT true;

-- ── 2) orders — 최신 반품 상태 캐시 (클레임 패턴) ──
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS return_status character varying NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS return_kind character varying,
  ADD COLUMN IF NOT EXISTS return_reason_code character varying,
  ADD COLUMN IF NOT EXISTS return_reason_detail text,
  ADD COLUMN IF NOT EXISTS return_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_owner_reply text,
  ADD COLUMN IF NOT EXISTS active_return_id uuid;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_return_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_return_status_check
  CHECK (return_status IN ('none', 'requested', 'approved', 'rejected', 'completed'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_return_kind_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_return_kind_check
  CHECK (return_kind IS NULL OR return_kind IN ('return', 'exchange'));

-- ── 3) order_returns ──
CREATE TABLE IF NOT EXISTS public.order_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id character varying NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind character varying NOT NULL,
  reason_code character varying NOT NULL,
  reason_detail text,
  status character varying NOT NULL DEFAULT 'requested',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  exchange_memo text,
  return_recipient_name character varying,
  return_phone character varying,
  return_postal_code character varying,
  return_address_line1 character varying,
  return_address_line2 character varying,
  gacha_return_status character varying,
  gacha_returned_at timestamptz,
  owner_reply text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT order_returns_kind_check CHECK (kind IN ('return', 'exchange')),
  CONSTRAINT order_returns_status_check CHECK (status IN ('requested', 'approved', 'rejected', 'completed', 'cancelled')),
  CONSTRAINT order_returns_gacha_status_check CHECK (
    gacha_return_status IS NULL OR gacha_return_status IN ('pending', 'returned', 'not_returnable')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS order_returns_one_active_per_order
  ON public.order_returns (order_id)
  WHERE status IN ('requested', 'approved');

CREATE INDEX IF NOT EXISTS idx_order_returns_store_status
  ON public.order_returns (store_id, status, requested_at DESC);

ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_active_return_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_active_return_id_fkey
  FOREIGN KEY (active_return_id) REFERENCES public.order_returns(id) ON DELETE SET NULL;

-- ── 4) request_return ──
CREATE OR REPLACE FUNCTION public.request_return(
  p_order_id uuid,
  p_kind character varying,
  p_reason_code character varying,
  p_reason_detail text,
  p_items jsonb,
  p_exchange_memo text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_store_id character varying;
  v_status character varying;
  v_return_status character varying;
  v_reward_type character varying;
  v_kind character varying := lower(trim(p_kind));
  v_reason character varying := lower(trim(p_reason_code));
  v_detail text := nullif(trim(p_reason_detail), '');
  v_memo text := nullif(trim(p_exchange_memo), '');
  v_items jsonb := COALESCE(p_items, '[]'::jsonb);
  v_return_id uuid;
  v_mind_allowed boolean;
  v_mind_days integer;
  v_exchange_allowed boolean;
  v_anchor timestamptz;
  v_has_gacha boolean;
  v_recipient character varying;
  v_phone character varying;
  v_postal character varying;
  v_line1 character varying;
  v_line2 character varying;
  v_item record;
BEGIN
  SELECT o.user_id, o.store_id, o.status, o.return_status, o.reward_type,
         COALESCE(o.purchase_confirmed_at, o.delivery_completed_at, o.shipped_at)
  INTO v_user_id, v_store_id, v_status, v_return_status, v_reward_type, v_anchor
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_status NOT IN ('shipped', 'delivery_completed', 'purchase_confirmed', 'completed') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  IF v_return_status IN ('requested', 'approved') THEN
    RAISE EXCEPTION 'return_already_active';
  END IF;

  IF v_kind NOT IN ('return', 'exchange') THEN
    RAISE EXCEPTION 'invalid_return_kind';
  END IF;

  IF v_reason NOT IN ('change_of_mind', 'defective', 'wrong_delivery', 'other') THEN
    RAISE EXCEPTION 'invalid_reason_code';
  END IF;

  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'empty_items';
  END IF;

  SELECT s.return_change_of_mind_allowed, s.return_change_of_mind_days, s.exchange_allowed,
         s.return_recipient_name, s.return_phone, s.return_postal_code,
         s.return_address_line1, s.return_address_line2
  INTO v_mind_allowed, v_mind_days, v_exchange_allowed,
       v_recipient, v_phone, v_postal, v_line1, v_line2
  FROM public.stores s
  WHERE s.id = v_store_id;

  IF v_kind = 'exchange' AND NOT COALESCE(v_exchange_allowed, true) THEN
    RAISE EXCEPTION 'exchange_not_allowed';
  END IF;

  IF v_reason = 'change_of_mind' THEN
    IF NOT COALESCE(v_mind_allowed, true) THEN
      RAISE EXCEPTION 'change_of_mind_not_allowed';
    END IF;
    IF v_anchor IS NOT NULL AND COALESCE(v_mind_days, 7) >= 0 THEN
      IF now() > v_anchor + (COALESCE(v_mind_days, 7) || ' days')::interval THEN
        RAISE EXCEPTION 'change_of_mind_expired';
      END IF;
    END IF;
  END IF;

  IF v_recipient IS NULL OR v_line1 IS NULL THEN
    RAISE EXCEPTION 'return_address_missing';
  END IF;

  FOR v_item IN
    SELECT elem
    FROM jsonb_array_elements(v_items) AS elem
  LOOP
    IF (v_item.elem->>'order_item_id') IS NULL OR (v_item.elem->>'quantity') IS NULL THEN
      RAISE EXCEPTION 'invalid_item_payload';
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.id = (v_item.elem->>'order_item_id')::uuid
        AND oi.order_id = p_order_id
        AND oi.quantity >= GREATEST(1, (v_item.elem->>'quantity')::integer)
    ) THEN
      RAISE EXCEPTION 'invalid_order_item';
    END IF;
  END LOOP;

  SELECT EXISTS (SELECT 1 FROM public.gacha_rolls gr WHERE gr.order_id = p_order_id)
  INTO v_has_gacha;

  INSERT INTO public.order_returns (
    order_id, store_id, user_id, kind, reason_code, reason_detail, status, items,
    exchange_memo,
    return_recipient_name, return_phone, return_postal_code, return_address_line1, return_address_line2,
    gacha_return_status, requested_at
  ) VALUES (
    p_order_id, v_store_id, v_user_id, v_kind, v_reason, v_detail, 'requested', v_items,
    CASE WHEN v_kind = 'exchange' THEN v_memo ELSE NULL END,
    v_recipient, v_phone, v_postal, v_line1, v_line2,
    CASE WHEN v_has_gacha THEN 'pending' ELSE NULL END,
    now()
  )
  RETURNING id INTO v_return_id;

  UPDATE public.orders o
  SET return_status = 'requested',
      return_kind = v_kind,
      return_reason_code = v_reason,
      return_reason_detail = v_detail,
      return_requested_at = now(),
      return_resolved_at = NULL,
      return_owner_reply = NULL,
      active_return_id = v_return_id
  WHERE o.id = p_order_id;

  RETURN v_return_id;
END;
$function$;

-- ── 5) approve_return / reject_return / complete_return ──
CREATE OR REPLACE FUNCTION public.approve_return(p_return_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order_id uuid;
  v_status character varying;
  v_store_id character varying;
BEGIN
  SELECT r.order_id, r.status, r.store_id
  INTO v_order_id, v_status, v_store_id
  FROM public.order_returns r
  WHERE r.id = p_return_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'return_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_status <> 'requested' THEN
    RAISE EXCEPTION 'invalid_return_state';
  END IF;

  UPDATE public.order_returns
  SET status = 'approved'
  WHERE id = p_return_id;

  UPDATE public.orders
  SET return_status = 'approved'
  WHERE id = v_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_return(p_return_id uuid, p_reply text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order_id uuid;
  v_status character varying;
  v_store_id character varying;
  v_reply text := trim(p_reply);
BEGIN
  SELECT r.order_id, r.status, r.store_id
  INTO v_order_id, v_status, v_store_id
  FROM public.order_returns r
  WHERE r.id = p_return_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'return_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_status <> 'requested' THEN
    RAISE EXCEPTION 'invalid_return_state';
  END IF;

  IF v_reply IS NULL OR length(v_reply) = 0 THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  IF length(v_reply) > 1000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  UPDATE public.order_returns
  SET status = 'rejected',
      owner_reply = v_reply,
      resolved_at = now()
  WHERE id = p_return_id;

  UPDATE public.orders
  SET return_status = 'rejected',
      return_resolved_at = now(),
      return_owner_reply = v_reply,
      active_return_id = NULL
  WHERE id = v_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_return(p_return_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order_id uuid;
  v_status character varying;
  v_store_id character varying;
  v_gacha_status character varying;
BEGIN
  SELECT r.order_id, r.status, r.store_id, r.gacha_return_status
  INTO v_order_id, v_status, v_store_id, v_gacha_status
  FROM public.order_returns r
  WHERE r.id = p_return_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'return_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'invalid_return_state';
  END IF;

  IF v_gacha_status = 'pending' THEN
    RAISE EXCEPTION 'gacha_return_pending';
  END IF;

  UPDATE public.order_returns
  SET status = 'completed',
      resolved_at = now()
  WHERE id = p_return_id;

  UPDATE public.orders
  SET return_status = 'completed',
      return_resolved_at = now(),
      active_return_id = NULL
  WHERE id = v_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_gacha_return_status(
  p_return_id uuid,
  p_status character varying
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_gacha_status character varying;
  v_new_status character varying := lower(trim(p_status));
BEGIN
  SELECT r.store_id, r.gacha_return_status
  INTO v_store_id, v_gacha_status
  FROM public.order_returns r
  WHERE r.id = p_return_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'return_not_found';
  END IF;

  IF v_gacha_status IS NULL THEN
    RAISE EXCEPTION 'no_gacha_on_order';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_new_status NOT IN ('pending', 'returned', 'not_returnable') THEN
    RAISE EXCEPTION 'invalid_gacha_status';
  END IF;

  UPDATE public.order_returns
  SET gacha_return_status = v_new_status,
      gacha_returned_at = CASE WHEN v_new_status = 'returned' THEN now() ELSE gacha_returned_at END
  WHERE id = p_return_id;
END;
$function$;

-- ── 6) get_order_return ──
CREATE OR REPLACE FUNCTION public.get_order_return(p_order_id uuid)
RETURNS TABLE(
  return_id uuid,
  order_id uuid,
  kind character varying,
  reason_code character varying,
  reason_detail text,
  status character varying,
  items jsonb,
  exchange_memo text,
  return_recipient_name character varying,
  return_phone character varying,
  return_postal_code character varying,
  return_address_line1 character varying,
  return_address_line2 character varying,
  gacha_return_status character varying,
  owner_reply text,
  requested_at timestamptz,
  resolved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_store_id character varying;
BEGIN
  SELECT o.user_id, o.store_id
  INTO v_user_id, v_store_id
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF auth.uid() <> v_user_id AND NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.order_id,
    r.kind,
    r.reason_code,
    r.reason_detail,
    r.status,
    r.items,
    r.exchange_memo,
    r.return_recipient_name,
    r.return_phone,
    r.return_postal_code,
    r.return_address_line1,
    r.return_address_line2,
    r.gacha_return_status,
    r.owner_reply,
    r.requested_at,
    r.resolved_at
  FROM public.order_returns r
  WHERE r.order_id = p_order_id
  ORDER BY r.requested_at DESC
  LIMIT 1;
END;
$function$;

-- ── 7) get_store_order_counts — open_returns ──
DROP FUNCTION IF EXISTS public.get_store_order_counts(character varying);

CREATE OR REPLACE FUNCTION public.get_store_order_counts(p_store_id character varying)
RETURNS TABLE(
  pending_accept integer,
  awaiting_ship integer,
  on_hold integer,
  open_claims integer,
  open_returns integer
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
    )::integer AS on_hold,
    COUNT(*) FILTER (
      WHERE o.claim_status = 'open'
    )::integer AS open_claims,
    COUNT(*) FILTER (
      WHERE o.return_status = 'requested'
    )::integer AS open_returns
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND o.status NOT IN ('rejected', 'cancelled');
END;
$function$;

-- ── 8) get_store_orders / get_my_orders — return cache columns ──
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
  claim_round_count integer,
  return_status character varying,
  return_kind character varying,
  return_reason_code character varying,
  return_reason_detail text,
  return_requested_at timestamptz,
  return_resolved_at timestamptz,
  return_owner_reply text,
  active_return_id uuid,
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
    o.claim_status, o.claim_message, o.claim_reply, o.claim_created_at, o.claim_resolved_at, o.claim_round_count,
    o.return_status, o.return_kind, o.return_reason_code, o.return_reason_detail,
    o.return_requested_at, o.return_resolved_at, o.return_owner_reply, o.active_return_id,
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
  WHERE o.store_id = p_store_id
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
  claim_round_count integer,
  return_status character varying,
  return_kind character varying,
  return_reason_code character varying,
  return_reason_detail text,
  return_requested_at timestamptz,
  return_resolved_at timestamptz,
  return_owner_reply text,
  active_return_id uuid,
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
    o.claim_status, o.claim_message, o.claim_reply, o.claim_created_at, o.claim_resolved_at, o.claim_round_count,
    o.return_status, o.return_kind, o.return_reason_code, o.return_reason_detail,
    o.return_requested_at, o.return_resolved_at, o.return_owner_reply, o.active_return_id,
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

REVOKE ALL ON FUNCTION public.request_return(uuid, character varying, character varying, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_return(uuid, character varying, character varying, text, jsonb, text) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_return(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_return(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_return(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_return(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_return(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_return(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.set_gacha_return_status(uuid, character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_gacha_return_status(uuid, character varying) TO authenticated;

REVOKE ALL ON FUNCTION public.get_order_return(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_return(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_store_order_counts(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_order_counts(character varying) TO authenticated;

REVOKE ALL ON FUNCTION public.get_store_orders(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_orders(character varying) FROM authenticated;

REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
