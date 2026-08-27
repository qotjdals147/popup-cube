-- AD-077 R1.5 — 문의 이력 보존 · 타임스탬프 · orders.claim_* = 최신 캐시

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS claim_round_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.order_claim_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  round_no integer NOT NULL,
  shopper_message text NOT NULL,
  owner_reply text,
  shopper_created_at timestamptz NOT NULL DEFAULT now(),
  owner_replied_at timestamptz,
  status character varying(10) NOT NULL DEFAULT 'open',
  CONSTRAINT order_claim_messages_status_check CHECK (status IN ('open', 'resolved')),
  CONSTRAINT order_claim_messages_round_unique UNIQUE (order_id, round_no)
);

CREATE INDEX IF NOT EXISTS idx_order_claim_messages_order_id
  ON public.order_claim_messages(order_id, round_no);

ALTER TABLE public.order_claim_messages ENABLE ROW LEVEL SECURITY;

-- Backfill existing v1 claims as round 1
INSERT INTO public.order_claim_messages (
  order_id, round_no, shopper_message, owner_reply,
  shopper_created_at, owner_replied_at, status
)
SELECT
  o.id,
  1,
  o.claim_message,
  o.claim_reply,
  COALESCE(o.claim_created_at, o.created_at),
  o.claim_resolved_at,
  CASE WHEN o.claim_status = 'open' THEN 'open' ELSE 'resolved' END
FROM public.orders o
WHERE o.claim_status <> 'none'
  AND NOT EXISTS (
    SELECT 1 FROM public.order_claim_messages m WHERE m.order_id = o.id
  );

UPDATE public.orders o
SET claim_round_count = 1
WHERE o.claim_status <> 'none' AND o.claim_round_count = 0;

CREATE OR REPLACE FUNCTION public.create_order_claim(p_order_id uuid, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_status character varying;
  v_claim_status character varying;
  v_message text := trim(p_message);
  v_round integer;
BEGIN
  SELECT o.user_id, o.status, o.claim_status
  INTO v_user_id, v_status, v_claim_status
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

  IF v_claim_status = 'open' THEN
    RAISE EXCEPTION 'claim_already_open';
  END IF;

  IF v_message IS NULL OR length(v_message) = 0 THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  IF length(v_message) > 1000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  SELECT COALESCE(MAX(m.round_no), 0) + 1
  INTO v_round
  FROM public.order_claim_messages m
  WHERE m.order_id = p_order_id;

  INSERT INTO public.order_claim_messages (
    order_id, round_no, shopper_message, shopper_created_at, status
  ) VALUES (
    p_order_id, v_round, v_message, now(), 'open'
  );

  UPDATE public.orders o
  SET claim_status = 'open',
      claim_message = v_message,
      claim_reply = NULL,
      claim_created_at = now(),
      claim_resolved_at = NULL,
      claim_round_count = v_round
  WHERE o.id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_order_claim(p_order_id uuid, p_reply text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_claim_status character varying;
  v_reply text := trim(p_reply);
  v_updated integer;
BEGIN
  SELECT o.store_id, o.claim_status
  INTO v_store_id, v_claim_status
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_claim_status <> 'open' THEN
    RAISE EXCEPTION 'invalid_claim_state';
  END IF;

  IF v_reply IS NULL OR length(v_reply) = 0 THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  IF length(v_reply) > 1000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  UPDATE public.order_claim_messages m
  SET owner_reply = v_reply,
      owner_replied_at = now(),
      status = 'resolved'
  WHERE m.order_id = p_order_id AND m.status = 'open';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'invalid_claim_state';
  END IF;

  UPDATE public.orders o
  SET claim_status = 'resolved',
      claim_reply = v_reply,
      claim_resolved_at = now()
  WHERE o.id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_order_claim_history(p_order_id uuid)
RETURNS TABLE(
  round_no integer,
  shopper_message text,
  owner_reply text,
  shopper_created_at timestamptz,
  owner_replied_at timestamptz,
  status character varying
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
    m.round_no,
    m.shopper_message,
    m.owner_reply,
    m.shopper_created_at,
    m.owner_replied_at,
    m.status
  FROM public.order_claim_messages m
  WHERE m.order_id = p_order_id
  ORDER BY m.round_no ASC;
END;
$function$;

-- get_store_orders / get_my_orders — claim_round_count
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
  claim_round_count integer,
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

REVOKE ALL ON FUNCTION public.list_order_claim_history(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_order_claim_history(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_store_orders(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_orders(character varying) TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
