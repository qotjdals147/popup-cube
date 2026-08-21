-- §58 #5 — 종료된 팝업 매장 place_order 차단 (KST 캘린더 기준 · 앱 D-day와 동일)

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
  v_popup_ends_at timestamptz;
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

  SELECT s.store_code, s.shipping_fee_type, s.shipping_fee_amount, s.shipping_free_threshold, s.popup_ends_at
  INTO v_store_code, v_fee_type, v_fee_amount, v_free_threshold, v_popup_ends_at
  FROM public.stores s
  WHERE s.id = p_store_id;

  IF v_store_code IS NULL THEN
    RAISE EXCEPTION 'store_code_missing';
  END IF;

  IF v_popup_ends_at IS NOT NULL
     AND (now() AT TIME ZONE 'Asia/Seoul')::date > (v_popup_ends_at AT TIME ZONE 'Asia/Seoul')::date THEN
    RAISE EXCEPTION 'popup_ended';
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
