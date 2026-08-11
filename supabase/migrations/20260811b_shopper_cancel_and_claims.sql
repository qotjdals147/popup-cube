-- §53 P0#8: 발송 전 취소(손님) + 클레임 v1 뼈대
-- - 손님이 「수락 대기 / 수락됨(발송 전)」 주문을 직접 취소 (재고·자동수락 횟수 복구)
-- - 배송중~구매확정 주문에 손님이 문의(클레임)를 남기고, 점주가 답변하면 종료되는 1:1 스레드 (order 컬럼에 직접 저장 — v1은 주문당 활성 클레임 1건)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by character varying(10),
  ADD COLUMN IF NOT EXISTS claim_status character varying(10) NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS claim_message text,
  ADD COLUMN IF NOT EXISTS claim_reply text,
  ADD COLUMN IF NOT EXISTS claim_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_resolved_at timestamptz;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_cancelled_by_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_cancelled_by_check CHECK (cancelled_by IS NULL OR cancelled_by IN ('owner', 'shopper'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_claim_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_claim_status_check CHECK (claim_status IN ('none', 'open', 'resolved'));

-- 손님: 발송 전(수락 대기·수락됨) 주문 취소
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
BEGIN
  SELECT o.user_id, o.status, o.auto_accepted
  INTO v_user_id, v_status, v_auto
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_status NOT IN ('awaiting_accept', 'accepted') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL) THEN
    RAISE EXCEPTION 'already_shipped';
  END IF;

  PERFORM public._restore_order_stock(p_order_id);

  IF v_auto THEN
    PERFORM public._restore_auto_accept_quota(p_order_id);
  END IF;

  UPDATE public.orders o
  SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'shopper'
  WHERE o.id = p_order_id;
END;
$function$;

-- 손님: 배송중~구매확정 주문에 문의(클레임) 등록 — 이전 클레임이 없거나 답변 완료된 경우만 새로 접수
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

  UPDATE public.orders o
  SET claim_status = 'open',
      claim_message = v_message,
      claim_reply = NULL,
      claim_created_at = now(),
      claim_resolved_at = NULL
  WHERE o.id = p_order_id;
END;
$function$;

-- 점주: 접수된 클레임에 답변 → 종료
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

  UPDATE public.orders o
  SET claim_status = 'resolved', claim_reply = v_reply, claim_resolved_at = now()
  WHERE o.id = p_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_order_by_shopper(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_claim(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_order_claim(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order_by_shopper(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_claim(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_order_claim(uuid, text) TO authenticated;

-- get_store_orders / get_my_orders — 취소·클레임 필드 추가 + 손님 취소 건도 점주/본인 목록에 노출 (거절된 건만 계속 숨김)

DROP FUNCTION IF EXISTS public.get_store_orders(character varying);

CREATE FUNCTION public.get_store_orders(p_store_id character varying)
RETURNS TABLE(
  order_id uuid,
  order_number integer,
  store_code character varying,
  total_amount integer,
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
    o.total_amount, o.discount_percent, o.reward_type, o.status, o.auto_accepted, o.accepted_at,
    o.tracking_number, o.shipped_at, o.delivery_completed_at, o.purchase_confirmed_at, o.purchase_confirm_auto,
    o.cancelled_at, o.cancelled_by,
    o.claim_status, o.claim_message, o.claim_reply, o.claim_created_at, o.claim_resolved_at,
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

REVOKE ALL ON FUNCTION public.get_store_orders(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_orders(character varying) TO authenticated;

DROP FUNCTION IF EXISTS public.get_my_orders();

CREATE FUNCTION public.get_my_orders()
RETURNS TABLE(
  order_id uuid,
  order_number integer,
  store_id character varying,
  store_code character varying,
  store_name character varying,
  total_amount integer,
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
  created_at timestamptz,
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  PERFORM public._auto_confirm_purchases();

  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.store_id,
    s.store_code,
    s.name,
    o.total_amount,
    o.discount_percent,
    o.reward_type,
    o.status,
    o.auto_accepted,
    o.accepted_at,
    o.tracking_number,
    o.shipped_at,
    o.delivery_completed_at,
    o.purchase_confirmed_at,
    o.purchase_confirm_auto,
    o.cancelled_at,
    o.cancelled_by,
    o.claim_status,
    o.claim_message,
    o.claim_reply,
    o.claim_created_at,
    o.claim_resolved_at,
    o.created_at,
    ua.recipient_name,
    ua.phone,
    ua.postal_code,
    ua.address_line1,
    ua.address_line2,
    oi.id,
    oi.product_id,
    pr.name,
    oi.quantity,
    oi.unit_price,
    gp.name AS gacha_product_name,
    ge.exclusive_name AS gacha_exclusive_name,
    gp.image_url AS gacha_product_image_url,
    ge.exclusive_image_url AS gacha_exclusive_image_url
  FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.user_addresses ua ON ua.id = o.shipping_address_id
  LEFT JOIN public.gacha_rolls gr ON gr.order_id = o.id
  LEFT JOIN public.gacha_pool_entries ge ON ge.id = gr.pool_entry_id
  LEFT JOIN public.products gp ON gp.id = ge.product_id
  WHERE o.user_id = auth.uid()
    AND o.status <> 'rejected'
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
