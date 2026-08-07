-- AD-054: get_store_orders()에 배송 완료·구매확정 컬럼 추가 (점주 발주·배송 탭 표시용)
-- RETURNS TABLE 컬럼 목록이 바뀌므로 CREATE OR REPLACE 대신 DROP 후 재생성.

DROP FUNCTION IF EXISTS public.get_store_orders(character varying);

CREATE FUNCTION public.get_store_orders(p_store_id character varying)
RETURNS TABLE(
  order_id uuid,
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
    o.id, o.total_amount, o.discount_percent, o.reward_type, o.status, o.auto_accepted, o.accepted_at,
    o.tracking_number, o.shipped_at, o.delivery_completed_at, o.purchase_confirmed_at, o.purchase_confirm_auto,
    o.created_at,
    prf.nickname, ua.label, ua.recipient_name, ua.phone, ua.postal_code, ua.address_line1, ua.address_line2,
    oi.id, oi.product_id, pr.name, oi.quantity, oi.unit_price,
    gp.name, ge.exclusive_name, gp.image_url, ge.exclusive_image_url
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.profiles prf ON prf.id = o.user_id
  LEFT JOIN public.user_addresses ua ON ua.id = o.shipping_address_id
  LEFT JOIN public.gacha_rolls gr ON gr.order_id = o.id
  LEFT JOIN public.gacha_pool_entries ge ON ge.id = gr.pool_entry_id
  LEFT JOIN public.products gp ON gp.id = ge.product_id
  WHERE o.store_id = p_store_id AND o.status NOT IN ('rejected', 'cancelled')
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_store_orders(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_orders(character varying) TO authenticated;
