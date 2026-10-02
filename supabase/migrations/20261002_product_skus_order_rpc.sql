-- AD-085 — get_store_orders / get_my_orders: order_items.option_label

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
  option_label character varying,
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
    oi.id, oi.product_id, pr.name, oi.quantity, oi.unit_price, oi.option_label,
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
  option_label character varying,
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
    oi.id, oi.product_id, pr.name, pr.image_url, oi.quantity, oi.unit_price, oi.option_label,
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

REVOKE ALL ON FUNCTION public.get_store_orders(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_orders(character varying) TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
