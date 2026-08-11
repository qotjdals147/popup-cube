-- §53.7 step 5 — 매장 정책·CS·반품지 + 배송비 규칙 (P0 #8, #9)

-- 1) stores — 운영 정보 + 배송비 규칙
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS cs_phone text,
  ADD COLUMN IF NOT EXISTS cs_email text,
  ADD COLUMN IF NOT EXISTS return_recipient_name text,
  ADD COLUMN IF NOT EXISTS return_phone text,
  ADD COLUMN IF NOT EXISTS return_postal_code text,
  ADD COLUMN IF NOT EXISTS return_address_line1 text,
  ADD COLUMN IF NOT EXISTS return_address_line2 text,
  ADD COLUMN IF NOT EXISTS shipping_guide text,
  ADD COLUMN IF NOT EXISTS exchange_return_guide text,
  ADD COLUMN IF NOT EXISTS shipping_fee_type character varying NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS shipping_fee_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_free_threshold integer NOT NULL DEFAULT 0;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_shipping_fee_type_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_shipping_fee_type_check
  CHECK (shipping_fee_type IN ('free', 'flat', 'conditional_free'));

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_shipping_fee_amount_nonneg;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_shipping_fee_amount_nonneg CHECK (shipping_fee_amount >= 0);

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_shipping_free_threshold_nonneg;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_shipping_free_threshold_nonneg CHECK (shipping_free_threshold >= 0);

-- 2) orders — 상품합계(할인 후) + 배송비 스냅샷
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_amount integer,
  ADD COLUMN IF NOT EXISTS shipping_fee integer NOT NULL DEFAULT 0;

UPDATE public.orders
SET subtotal_amount = total_amount,
    shipping_fee = 0
WHERE subtotal_amount IS NULL;

-- 3) 배송비 계산 (할인 적용 후 상품합 기준)
CREATE OR REPLACE FUNCTION public.calc_store_shipping_fee(
  p_fee_type character varying,
  p_fee_amount integer,
  p_free_threshold integer,
  p_subtotal_after_discount integer
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_fee_type = 'free' THEN
    RETURN 0;
  ELSIF p_fee_type = 'flat' THEN
    RETURN GREATEST(0, COALESCE(p_fee_amount, 0));
  ELSIF p_fee_type = 'conditional_free' THEN
    IF COALESCE(p_subtotal_after_discount, 0) >= GREATEST(0, COALESCE(p_free_threshold, 0)) THEN
      RETURN 0;
    END IF;
    RETURN GREATEST(0, COALESCE(p_fee_amount, 0));
  END IF;
  RETURN 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.calc_store_shipping_fee(character varying, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calc_store_shipping_fee(character varying, integer, integer, integer) TO authenticated;

-- 4) place_order — 배송비 반영 + 반환 컬럼 확장
DROP FUNCTION IF EXISTS public.place_order(character varying, uuid, jsonb, character varying, integer);

CREATE OR REPLACE FUNCTION public.place_order(
  p_store_id character varying,
  p_address_id uuid,
  p_items jsonb,
  p_reward_type character varying,
  p_discount_percent integer
)
RETURNS TABLE(
  order_id uuid,
  total_amount integer,
  subtotal_amount integer,
  shipping_fee integer,
  order_number integer,
  store_code character varying
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_number integer;
  v_store_code character varying;
  v_fee_type character varying;
  v_fee_amount integer;
  v_free_threshold integer;
  v_item jsonb;
  v_product_id uuid;
  v_product_price integer;
  v_quantity integer;
  v_subtotal integer := 0;
  v_discounted_subtotal integer;
  v_shipping_fee integer := 0;
  v_final_total integer;
  v_item_count integer := 0;
  v_can_auto boolean := true;
  v_status character varying;
  v_stock integer;
  v_auto_on boolean;
  v_auto_rem integer;
  v_seen_products uuid[] := ARRAY[]::uuid[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT s.store_code, s.shipping_fee_type, s.shipping_fee_amount, s.shipping_free_threshold
  INTO v_store_code, v_fee_type, v_fee_amount, v_free_threshold
  FROM public.stores s
  WHERE s.id = p_store_id;

  IF v_store_code IS NULL THEN
    RAISE EXCEPTION 'store_code_missing';
  END IF;

  IF p_reward_type NOT IN ('discount', 'gacha') THEN
    RAISE EXCEPTION 'invalid_reward_type';
  END IF;

  IF p_address_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_addresses WHERE id = p_address_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'invalid_address';
    END IF;
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.id, p.price, p.stock_quantity, p.auto_accept_enabled, p.auto_accept_remaining
    INTO v_product_id, v_product_price, v_stock, v_auto_on, v_auto_rem
    FROM public.products p
    WHERE p.id = (v_item->>'product_id')::uuid
      AND p.store_id = p_store_id
      AND p.is_active = true;

    IF v_product_id IS NULL THEN
      CONTINUE;
    END IF;

    v_quantity := GREATEST(1, (v_item->>'quantity')::integer);

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    v_item_count := v_item_count + 1;

    IF NOT (v_auto_on AND v_auto_rem > 0) THEN
      v_can_auto := false;
    END IF;
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  IF p_reward_type = 'discount' THEN
    IF p_discount_percent IS NULL OR p_discount_percent <= 0 OR p_discount_percent > 100 THEN
      RAISE EXCEPTION 'invalid_discount';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.store_promotions
      WHERE store_id = p_store_id AND is_active = true AND discount_percent = p_discount_percent
    ) THEN
      RAISE EXCEPTION 'discount_mismatch';
    END IF;
  END IF;

  SELECT COALESCE(MAX(o.order_number), 0) + 1
  INTO v_order_number
  FROM public.orders o
  WHERE o.store_id = p_store_id;

  v_order_id := gen_random_uuid();

  IF v_can_auto THEN
    v_status := 'accepted';
  ELSE
    v_status := 'awaiting_accept';
  END IF;

  INSERT INTO public.orders (
    id, store_id, user_id, shipping_address_id, total_amount, subtotal_amount, shipping_fee,
    discount_percent, reward_type, status, auto_accepted, accepted_at, order_number
  )
  VALUES (
    v_order_id, p_store_id, v_user_id, p_address_id, 0, 0, 0,
    CASE WHEN p_reward_type = 'discount' THEN p_discount_percent ELSE NULL END,
    p_reward_type, v_status, v_can_auto,
    CASE WHEN v_can_auto THEN now() ELSE NULL END,
    v_order_number
  );

  v_subtotal := 0;
  v_item_count := 0;
  v_seen_products := ARRAY[]::uuid[];

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.id, p.price, p.stock_quantity
    INTO v_product_id, v_product_price, v_stock
    FROM public.products p
    WHERE p.id = (v_item->>'product_id')::uuid
      AND p.store_id = p_store_id
      AND p.is_active = true;

    IF v_product_id IS NULL THEN
      CONTINUE;
    END IF;

    v_quantity := GREATEST(1, (v_item->>'quantity')::integer);

    UPDATE public.products p
    SET stock_quantity = p.stock_quantity - v_quantity,
        updated_at = now()
    WHERE p.id = v_product_id
      AND p.stock_quantity >= v_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    v_subtotal := v_subtotal + (v_product_price * v_quantity);
    v_item_count := v_item_count + 1;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, v_product_id, v_quantity, v_product_price);

    IF v_can_auto AND NOT (v_product_id = ANY (v_seen_products)) THEN
      UPDATE public.products p
      SET auto_accept_remaining = p.auto_accept_remaining - 1,
          updated_at = now()
      WHERE p.id = v_product_id
        AND p.auto_accept_enabled = true
        AND p.auto_accept_remaining > 0;

      v_seen_products := array_append(v_seen_products, v_product_id);
    END IF;
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  IF p_reward_type = 'discount' THEN
    v_discounted_subtotal := round(v_subtotal * (100 - p_discount_percent) / 100.0);
  ELSE
    v_discounted_subtotal := v_subtotal;
  END IF;

  v_shipping_fee := public.calc_store_shipping_fee(
    v_fee_type, v_fee_amount, v_free_threshold, v_discounted_subtotal
  );
  v_final_total := v_discounted_subtotal + v_shipping_fee;

  UPDATE public.orders
  SET subtotal_amount = v_discounted_subtotal,
      shipping_fee = v_shipping_fee,
      total_amount = v_final_total
  WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_final_total, v_discounted_subtotal, v_shipping_fee, v_order_number, v_store_code;
END;
$function$;

REVOKE ALL ON FUNCTION public.place_order(character varying, uuid, jsonb, character varying, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(character varying, uuid, jsonb, character varying, integer) TO authenticated;

-- 5) get_store_orders — subtotal_amount, shipping_fee
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

-- 6) get_my_orders — subtotal_amount, shipping_fee
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

  RETURN QUERY
  SELECT
    o.id, o.order_number, o.store_id, st.store_code, st.name,
    o.total_amount, COALESCE(o.subtotal_amount, o.total_amount), COALESCE(o.shipping_fee, 0),
    o.discount_percent, o.reward_type, o.status, o.auto_accepted, o.accepted_at,
    o.tracking_number, o.shipped_at, o.delivery_completed_at, o.purchase_confirmed_at, o.purchase_confirm_auto,
    o.cancelled_at, o.cancelled_by,
    o.claim_status, o.claim_message, o.claim_reply, o.claim_created_at, o.claim_resolved_at,
    o.created_at,
    ua.recipient_name, ua.phone, ua.postal_code, ua.address_line1, ua.address_line2,
    oi.id, oi.product_id, pr.name, oi.quantity, oi.unit_price,
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

REVOKE ALL ON FUNCTION public.get_my_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_orders() TO authenticated;
