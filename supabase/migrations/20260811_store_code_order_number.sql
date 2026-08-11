-- §53 P0#7: 매장 주문 코드(store_code) + 매장별 순번(order_number)
-- 사람용 주문번호 = {store_code}-{order_number} (예: GUCCI-1042)
-- store_code = 영문·숫자 (한글 매장명과 분리)

-- 1) stores.store_code
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS store_code character varying(12);

UPDATE public.stores SET store_code = 'GUCCI' WHERE id = 'popup_gucci_01';

WITH candidates AS (
  SELECT
    s.id,
    CASE
      WHEN s.id = 'popup_gucci_01' THEN 'GUCCI'
      ELSE upper(substring(regexp_replace(s.id, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
    END AS base_code
  FROM public.stores s
  WHERE s.store_code IS NULL OR trim(s.store_code) = ''
),
numbered AS (
  SELECT id, base_code, row_number() OVER (PARTITION BY base_code ORDER BY id) AS rn
  FROM candidates
)
UPDATE public.stores s
SET store_code = CASE
  WHEN n.rn = 1 THEN n.base_code
  ELSE substring(n.base_code FROM 1 FOR 8) || n.rn::text
END
FROM numbered n
WHERE s.id = n.id;

ALTER TABLE public.stores
  ALTER COLUMN store_code SET NOT NULL;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_store_code_format;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_store_code_format CHECK (store_code ~ '^[A-Z0-9]{2,12}$');

CREATE UNIQUE INDEX IF NOT EXISTS stores_store_code_key ON public.stores (store_code);

-- 2) orders.order_number (매장별 1부터)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number integer;

WITH numbered AS (
  SELECT
    o.id,
    row_number() OVER (PARTITION BY o.store_id ORDER BY o.created_at, o.id) AS rn
  FROM public.orders o
)
UPDATE public.orders o
SET order_number = n.rn
FROM numbered n
WHERE o.id = n.id AND o.order_number IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN order_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_store_id_order_number_key
  ON public.orders (store_id, order_number);

-- 3) create_owner_store — store_code 필수
DROP FUNCTION IF EXISTS public.create_owner_store(character varying, character varying, text, text);
DROP FUNCTION IF EXISTS public.create_owner_store(character varying, character varying, character varying, text, text);

CREATE OR REPLACE FUNCTION public.create_owner_store(
  p_id character varying,
  p_name character varying,
  p_store_code character varying,
  p_description text,
  p_thumbnail_url text
)
RETURNS character varying
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_code character varying := upper(trim(p_store_code));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF v_code IS NULL OR length(v_code) < 2 OR length(v_code) > 12 THEN
    RAISE EXCEPTION 'invalid_store_code';
  END IF;

  IF v_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'invalid_store_code_format';
  END IF;

  INSERT INTO public.stores (id, name, store_code, description, thumbnail_url, owner_id, status, map_config)
  VALUES (
    p_id,
    p_name,
    v_code,
    p_description,
    p_thumbnail_url,
    auth.uid(),
    'draft',
    jsonb_build_object(
      'storeId', p_id,
      'mapSize', jsonb_build_object('width', 20, 'height', 20),
      'layers', jsonb_build_object('floor', '[]'::jsonb, 'objects', '[]'::jsonb)
    )
  );

  UPDATE public.profiles
  SET role = 'owner', store_id = p_id, updated_at = now()
  WHERE id = auth.uid();

  RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_owner_store(character varying, character varying, character varying, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_owner_store(character varying, character varying, character varying, text, text) TO authenticated;

-- 4) place_order — order_number 부여 + 반환 확장
DROP FUNCTION IF EXISTS public.place_order(character varying, uuid, jsonb, character varying, integer);

CREATE OR REPLACE FUNCTION public.place_order(
  p_store_id character varying,
  p_address_id uuid,
  p_items jsonb,
  p_reward_type character varying,
  p_discount_percent integer
)
RETURNS TABLE(order_id uuid, total_amount integer, order_number integer, store_code character varying)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_number integer;
  v_store_code character varying;
  v_item jsonb;
  v_product_id uuid;
  v_product_price integer;
  v_quantity integer;
  v_subtotal integer := 0;
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

  SELECT s.store_code INTO v_store_code
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
    id, store_id, user_id, shipping_address_id, total_amount, discount_percent,
    reward_type, status, auto_accepted, accepted_at, order_number
  )
  VALUES (
    v_order_id, p_store_id, v_user_id, p_address_id, 0,
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
    v_final_total := round(v_subtotal * (100 - p_discount_percent) / 100.0);
  ELSE
    v_final_total := v_subtotal;
  END IF;

  UPDATE public.orders SET total_amount = v_final_total WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_final_total, v_order_number, v_store_code;
END;
$function$;

-- 5) get_store_orders — order_number, store_code
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
  WHERE o.store_id = p_store_id AND o.status NOT IN ('rejected', 'cancelled')
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_store_orders(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_orders(character varying) TO authenticated;

-- 6) get_my_orders — order_number, store_code
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
