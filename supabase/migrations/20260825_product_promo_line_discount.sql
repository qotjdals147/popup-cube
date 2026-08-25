-- AD-028 v1b — 매장 기본 + 상품별 프로모 · 라인 할인 · place_order 서버 검증

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promo_mode character varying NOT NULL DEFAULT 'inherit',
  ADD COLUMN IF NOT EXISTS promo_discount_percent integer;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_promo_mode_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_promo_mode_check
  CHECK (promo_mode IN ('inherit', 'none', 'discount_only', 'gacha_only', 'choice'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_promo_discount_percent_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_promo_discount_percent_check
  CHECK (
    promo_discount_percent IS NULL
    OR (promo_discount_percent >= 1 AND promo_discount_percent <= 100)
  );

ALTER TABLE public.store_promotions
  ADD COLUMN IF NOT EXISTS default_promo_mode character varying NOT NULL DEFAULT 'choice';

ALTER TABLE public.store_promotions
  DROP CONSTRAINT IF EXISTS store_promotions_default_promo_mode_check;

ALTER TABLE public.store_promotions
  ADD CONSTRAINT store_promotions_default_promo_mode_check
  CHECK (default_promo_mode IN ('none', 'discount_only', 'gacha_only', 'choice'));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS line_discount_percent integer;

-- 상품·매장 설정 → 실효 혜택 모드 + 할인율
CREATE OR REPLACE FUNCTION public.resolve_effective_promo(
  p_product_promo_mode character varying,
  p_product_discount integer,
  p_store_active boolean,
  p_store_mode character varying,
  p_store_discount integer,
  OUT effective_mode character varying,
  OUT effective_discount integer
)
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  v_mode character varying;
  v_discount integer := 0;
BEGIN
  IF p_product_promo_mode = 'inherit' THEN
    IF NOT p_store_active THEN
      effective_mode := 'none';
      effective_discount := 0;
      RETURN;
    END IF;
    v_mode := COALESCE(p_store_mode, 'choice');
  ELSE
    v_mode := p_product_promo_mode;
  END IF;

  IF v_mode IN ('discount_only', 'choice') THEN
    v_discount := COALESCE(
      p_product_discount,
      CASE WHEN p_store_active THEN p_store_discount ELSE NULL END,
      0
    );
    v_discount := GREATEST(0, LEAST(100, v_discount));
    IF v_mode = 'discount_only' AND v_discount <= 0 THEN
      effective_mode := 'none';
      effective_discount := 0;
      RETURN;
    END IF;
  END IF;

  effective_mode := v_mode;
  effective_discount := v_discount;
END;
$function$;

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
  v_product_promo_mode character varying;
  v_product_discount integer;
  v_quantity integer;
  v_subtotal integer := 0;
  v_discounted_subtotal integer := 0;
  v_shipping_fee integer := 0;
  v_final_total integer;
  v_item_count integer := 0;
  v_can_auto boolean := true;
  v_status character varying;
  v_stock integer;
  v_auto_on boolean;
  v_auto_rem integer;
  v_seen_products uuid[] := ARRAY[]::uuid[];
  v_store_promo_active boolean := false;
  v_store_mode character varying := 'none';
  v_store_discount integer := 0;
  v_effective_mode character varying;
  v_effective_discount integer;
  v_line_discount integer;
  v_line_total integer;
  v_has_discount_eligible boolean := false;
  v_has_gacha_eligible boolean := false;
  v_order_discount_percent integer;
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

  SELECT sp.is_active, sp.default_promo_mode, sp.discount_percent
  INTO v_store_promo_active, v_store_mode, v_store_discount
  FROM public.store_promotions sp
  WHERE sp.store_id = p_store_id;

  IF NOT FOUND THEN
    v_store_promo_active := false;
    v_store_mode := 'none';
    v_store_discount := 0;
  END IF;

  -- Pass 1: stock / auto-accept + reward eligibility
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.id, p.price, p.stock_quantity, p.auto_accept_enabled, p.auto_accept_remaining,
           p.promo_mode, p.promo_discount_percent
    INTO v_product_id, v_product_price, v_stock, v_auto_on, v_auto_rem,
         v_product_promo_mode, v_product_discount
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

    SELECT r.effective_mode, r.effective_discount
    INTO v_effective_mode, v_effective_discount
    FROM public.resolve_effective_promo(
      v_product_promo_mode,
      v_product_discount,
      v_store_promo_active,
      v_store_mode,
      v_store_discount
    ) AS r;

    IF v_effective_mode IN ('discount_only', 'choice') AND v_effective_discount > 0 THEN
      v_has_discount_eligible := true;
    END IF;
    IF v_effective_mode IN ('gacha_only', 'choice') THEN
      v_has_gacha_eligible := true;
    END IF;

    v_item_count := v_item_count + 1;

    IF NOT (v_auto_on AND v_auto_rem > 0) THEN
      v_can_auto := false;
    END IF;
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  IF p_reward_type = 'discount' AND NOT v_has_discount_eligible THEN
    IF v_has_gacha_eligible THEN
      RAISE EXCEPTION 'invalid_reward_choice';
    END IF;
  END IF;

  IF p_reward_type = 'gacha' AND NOT v_has_gacha_eligible THEN
    IF v_has_discount_eligible THEN
      RAISE EXCEPTION 'invalid_reward_choice';
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

  v_order_discount_percent := NULL;

  INSERT INTO public.orders (
    id, store_id, user_id, shipping_address_id, total_amount, subtotal_amount, shipping_fee,
    discount_percent, reward_type, status, auto_accepted, accepted_at, order_number
  )
  VALUES (
    v_order_id, p_store_id, v_user_id, p_address_id, 0, 0, 0,
    NULL,
    p_reward_type, v_status, v_can_auto,
    CASE WHEN v_can_auto THEN now() ELSE NULL END,
    v_order_number
  );

  v_subtotal := 0;
  v_discounted_subtotal := 0;
  v_item_count := 0;
  v_seen_products := ARRAY[]::uuid[];

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.id, p.price, p.stock_quantity, p.promo_mode, p.promo_discount_percent
    INTO v_product_id, v_product_price, v_stock, v_product_promo_mode, v_product_discount
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

    SELECT r.effective_mode, r.effective_discount
    INTO v_effective_mode, v_effective_discount
    FROM public.resolve_effective_promo(
      v_product_promo_mode,
      v_product_discount,
      v_store_promo_active,
      v_store_mode,
      v_store_discount
    ) AS r;

    v_line_discount := 0;
    IF p_reward_type = 'discount'
       AND v_effective_mode IN ('discount_only', 'choice')
       AND v_effective_discount > 0 THEN
      v_line_discount := v_effective_discount;
    END IF;

    v_line_total := v_product_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
    v_discounted_subtotal := v_discounted_subtotal + round(v_line_total * (100 - v_line_discount) / 100.0);
    v_item_count := v_item_count + 1;

    IF v_line_discount > 0 AND v_order_discount_percent IS NULL THEN
      v_order_discount_percent := v_line_discount;
    ELSIF v_line_discount > 0 AND v_order_discount_percent IS DISTINCT FROM v_line_discount THEN
      v_order_discount_percent := NULL;
    END IF;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, line_discount_percent)
    VALUES (v_order_id, v_product_id, v_quantity, v_product_price, NULLIF(v_line_discount, 0));

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

  v_shipping_fee := public.calc_store_shipping_fee(
    v_fee_type, v_fee_amount, v_free_threshold, v_discounted_subtotal
  );
  v_final_total := v_discounted_subtotal + v_shipping_fee;

  UPDATE public.orders
  SET subtotal_amount = v_discounted_subtotal,
      shipping_fee = v_shipping_fee,
      total_amount = v_final_total,
      discount_percent = CASE WHEN p_reward_type = 'discount' THEN v_order_discount_percent ELSE NULL END
  WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_final_total, v_discounted_subtotal, v_shipping_fee, v_order_number, v_store_code;
END;
$function$;

REVOKE ALL ON FUNCTION public.place_order(character varying, uuid, jsonb, character varying, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(character varying, uuid, jsonb, character varying, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.store_has_active_gacha_pool(p_store_id character varying)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gacha_pools gp
    INNER JOIN public.gacha_pool_entries gpe ON gpe.pool_id = gp.id
    WHERE gp.store_id = p_store_id
      AND gp.linked_product_id IS NULL
      AND gp.is_active = TRUE
      AND gpe.is_active = TRUE
      AND gpe.weight > 0
  );
$$;

REVOKE ALL ON FUNCTION public.store_has_active_gacha_pool(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_has_active_gacha_pool(character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_has_active_gacha_pool(character varying) TO anon;
