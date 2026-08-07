-- AD-054: get_my_orders()에 purchase_confirm_auto 컬럼 추가 (손님 화면 "자동 구매확정" 표시용)

DROP FUNCTION IF EXISTS public.get_my_orders();

CREATE FUNCTION public.get_my_orders()
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
  purchase_confirm_auto boolean,
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
    o.purchase_confirm_auto,
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

REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
