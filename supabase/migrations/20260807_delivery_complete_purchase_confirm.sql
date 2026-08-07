-- AD-054: 배송 완료(점주) · 구매확정(손님, 수동/7일 자동) · 손님 「내 주문」 조회

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS purchase_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS purchase_confirm_auto boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending', 'paid', 'awaiting_accept', 'accepted', 'rejected',
    'shipped', 'delivery_completed', 'purchase_confirmed', 'completed', 'cancelled'
  )
);

-- 점주: 배송 시작(shipped) → 배송 완료
CREATE OR REPLACE FUNCTION public.complete_delivery(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_status character varying;
BEGIN
  SELECT o.store_id, o.status INTO v_store_id, v_status
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

  IF v_status <> 'shipped' THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  UPDATE public.orders o
  SET status = 'delivery_completed', delivery_completed_at = now()
  WHERE o.id = p_order_id;
END;
$function$;

-- 내부: 주문일(created_at)로부터 7일 지났고 미확정인 건 자동 구매확정 (AD-054)
CREATE OR REPLACE FUNCTION public._auto_confirm_purchases()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.orders o
  SET status = 'purchase_confirmed',
      purchase_confirmed_at = now(),
      purchase_confirm_auto = true
  WHERE o.status IN ('shipped', 'delivery_completed')
    AND o.created_at <= now() - interval '7 days'
    AND o.purchase_confirmed_at IS NULL;
END;
$function$;

-- 손님: 수동 구매확정
CREATE OR REPLACE FUNCTION public.confirm_purchase(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_status character varying;
BEGIN
  SELECT o.user_id, o.status INTO v_user_id, v_status
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_status NOT IN ('shipped', 'delivery_completed') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  UPDATE public.orders o
  SET status = 'purchase_confirmed',
      purchase_confirmed_at = now(),
      purchase_confirm_auto = false
  WHERE o.id = p_order_id;
END;
$function$;

-- 손님 「내 주문」 목록 (매장 전체 아님 — 로그인한 손님 본인 주문만, 여러 매장 통합)
CREATE OR REPLACE FUNCTION public.get_my_orders()
RETURNS TABLE(
  order_id uuid,
  store_id character varying,
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

  -- 조회할 때마다 7일 지난 미확정 주문을 자동 확정 (pg_cron 미가동 시 안전망)
  PERFORM public._auto_confirm_purchases();

  RETURN QUERY
  SELECT
    o.id,
    o.store_id,
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
    AND o.status NOT IN ('rejected', 'cancelled')
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_delivery(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_purchase(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_purchase(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;

-- 7일 자동 구매확정 배치 — pg_cron 확장이 가능하면 매일 새벽 3시(UTC) 실행.
-- 확장을 못 켜는 프로젝트여도 get_my_orders() 호출 시 위 PERFORM으로 안전하게 동작(안전망).
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension not enabled — relying on lazy auto-confirm inside get_my_orders()';
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'auto_confirm_purchases_daily',
      '0 3 * * *',
      $cron$SELECT public._auto_confirm_purchases();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule failed — relying on lazy auto-confirm inside get_my_orders()';
END $$;
