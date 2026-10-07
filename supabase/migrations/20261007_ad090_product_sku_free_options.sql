-- AD-090 — 상품 옵션 자유 N개 (AD-085 「색·사이즈 2개 고정」 폐기)
--
-- 왜: 점주가 옵션명 자체를 직접 만들 수 있어야 한다 (컬러·사이즈·소재·길이·각인…).
--     스마트스토어 「조합형」과 같은 모델 → 엑셀 일괄등록(AD-088) 매핑이 1:1.
--
-- 모델: product_skus.option_values jsonb
--       [{"name":"컬러","value":"빨강"},{"name":"사이즈","value":"S"}]   순서 = 점주가 만든 옵션 순서
--       option_label = value 들을 ' / ' 로 이어 붙인 것 → 주문 스냅샷 형식 그대로 유지
--
-- color/size 칼럼은 롤백 여지를 위해 한 사이클 남겨둔다 (이후 마이그레이션에서 DROP).
-- 옵션명 최대 개수(3)는 save RPC 에서 검사 — 상한을 바꿀 때 테이블 재작성이 필요 없도록.

ALTER TABLE public.product_skus
  ADD COLUMN IF NOT EXISTS option_values jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 기존 색·사이즈 → option_values 백필
UPDATE public.product_skus ps
SET option_values = COALESCE(
  (
    SELECT jsonb_agg(x.elem ORDER BY x.ord)
    FROM (
      SELECT 1 AS ord, jsonb_build_object('name', '컬러', 'value', btrim(ps.color)) AS elem
      WHERE NULLIF(btrim(COALESCE(ps.color, '')), '') IS NOT NULL
      UNION ALL
      SELECT 2 AS ord, jsonb_build_object('name', '사이즈', 'value', btrim(ps.size)) AS elem
      WHERE NULLIF(btrim(COALESCE(ps.size, '')), '') IS NOT NULL
    ) x
  ),
  '[]'::jsonb
)
WHERE jsonb_typeof(ps.option_values) IS DISTINCT FROM 'array'
   OR jsonb_array_length(ps.option_values) = 0;

-- 색·사이즈 중 하나 필수 → option_values 1개 이상 필수
ALTER TABLE public.product_skus DROP CONSTRAINT IF EXISTS product_skus_option_present;
ALTER TABLE public.product_skus DROP CONSTRAINT IF EXISTS product_skus_option_values_present;
ALTER TABLE public.product_skus
  ADD CONSTRAINT product_skus_option_values_present CHECK (
    jsonb_typeof(option_values) = 'array' AND jsonb_array_length(option_values) > 0
  );

-- ISS-055 — search_path 고정 (구 함수는 호환용으로 남김)
CREATE OR REPLACE FUNCTION public.format_product_sku_label(p_color character varying, p_size character varying)
RETURNS character varying
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT NULLIF(
    btrim(
      concat_ws(
        ' / ',
        NULLIF(btrim(COALESCE(p_color, '')), ''),
        NULLIF(btrim(COALESCE(p_size, '')), '')
      )
    ),
    ''
  )::character varying;
$$;

CREATE OR REPLACE FUNCTION public.format_sku_option_label(p_option_values jsonb)
RETURNS character varying
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT NULLIF(
    COALESCE(
      (
        SELECT string_agg(btrim(e.value->>'value'), ' / ' ORDER BY e.ord)
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(p_option_values) = 'array' THEN p_option_values ELSE '[]'::jsonb END
        ) WITH ORDINALITY AS e(value, ord)
        WHERE NULLIF(btrim(COALESCE(e.value->>'value', '')), '') IS NOT NULL
      ),
      ''
    ),
    ''
  )::character varying;
$$;

-- 반환 타입이 바뀜(color·size → option_values) → CREATE OR REPLACE 불가 (42P13)
DROP FUNCTION IF EXISTS public.get_product_skus(uuid);
DROP FUNCTION IF EXISTS public.get_owner_product_skus(uuid);

CREATE OR REPLACE FUNCTION public.get_product_skus(p_product_id uuid)
RETURNS TABLE(
  sku_id uuid,
  option_values jsonb,
  option_label character varying,
  stock_quantity integer,
  price_delta integer,
  sort_order smallint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = p_product_id
      AND p.is_active = true
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ps.id,
    ps.option_values,
    public.format_sku_option_label(ps.option_values),
    ps.stock_quantity,
    COALESCE(ps.price_delta, 0),
    ps.sort_order
  FROM public.product_skus ps
  WHERE ps.product_id = p_product_id
    AND ps.is_active = true
  ORDER BY ps.sort_order ASC, ps.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_owner_product_skus(p_product_id uuid)
RETURNS TABLE(
  sku_id uuid,
  option_values jsonb,
  option_label character varying,
  stock_quantity integer,
  price_delta integer,
  is_active boolean,
  sort_order smallint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = p_product_id
      AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  RETURN QUERY
  SELECT
    ps.id,
    ps.option_values,
    public.format_sku_option_label(ps.option_values),
    ps.stock_quantity,
    COALESCE(ps.price_delta, 0),
    ps.is_active,
    ps.sort_order
  FROM public.product_skus ps
  WHERE ps.product_id = p_product_id
  ORDER BY ps.sort_order ASC, ps.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_owner_product_skus(
  p_product_id uuid,
  p_rows jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  c_max_groups constant integer := 3;
  v_row jsonb;
  v_raw jsonb;
  v_el jsonb;
  v_name text;
  v_value text;
  v_values jsonb;
  v_label character varying;
  v_stock integer;
  v_delta integer;
  v_sort smallint;
  v_idx integer := 0;
  v_seen text[] := ARRAY[]::text[];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = p_product_id
      AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'invalid_rows';
  END IF;

  DELETE FROM public.product_skus ps WHERE ps.product_id = p_product_id;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_raw := v_row->'option_values';

    -- 구 형식(color/size) 호환 — 예전 클라이언트가 남아 있어도 저장은 되게
    IF v_raw IS NULL OR jsonb_typeof(v_raw) <> 'array' THEN
      v_raw := COALESCE(
        (
          SELECT jsonb_agg(x.elem ORDER BY x.ord)
          FROM (
            SELECT 1 AS ord, jsonb_build_object('name', '컬러', 'value', btrim(v_row->>'color')) AS elem
            WHERE NULLIF(btrim(COALESCE(v_row->>'color', '')), '') IS NOT NULL
            UNION ALL
            SELECT 2 AS ord, jsonb_build_object('name', '사이즈', 'value', btrim(v_row->>'size')) AS elem
            WHERE NULLIF(btrim(COALESCE(v_row->>'size', '')), '') IS NOT NULL
          ) x
        ),
        '[]'::jsonb
      );
    END IF;

    IF jsonb_array_length(v_raw) > c_max_groups THEN
      RAISE EXCEPTION 'too_many_option_groups';
    END IF;

    v_values := '[]'::jsonb;
    FOR v_el IN SELECT * FROM jsonb_array_elements(v_raw)
    LOOP
      v_value := NULLIF(btrim(COALESCE(v_el->>'value', '')), '');
      IF v_value IS NULL THEN
        CONTINUE;
      END IF;
      v_name := COALESCE(NULLIF(btrim(COALESCE(v_el->>'name', '')), ''), '옵션');
      v_values := v_values || jsonb_build_array(
        jsonb_build_object('name', left(v_name, 40), 'value', left(v_value, 40))
      );
    END LOOP;

    IF jsonb_array_length(v_values) = 0 THEN
      CONTINUE;
    END IF;

    v_label := public.format_sku_option_label(v_values);
    IF v_label IS NULL THEN
      CONTINUE;
    END IF;

    -- 같은 조합 중복 저장 방지 (손님이 같은 라벨 2개를 보면 고를 수 없다)
    IF lower(v_label::text) = ANY (v_seen) THEN
      CONTINUE;
    END IF;
    v_seen := array_append(v_seen, lower(v_label::text));

    v_stock := GREATEST(0, COALESCE((v_row->>'stock_quantity')::integer, 0));
    v_delta := COALESCE((v_row->>'price_delta')::integer, 0);
    v_sort := COALESCE((v_row->>'sort_order')::smallint, v_idx::smallint);

    INSERT INTO public.product_skus (
      product_id, option_values, stock_quantity, price_delta, is_active, sort_order
    )
    VALUES (
      p_product_id,
      v_values,
      v_stock,
      v_delta,
      COALESCE((v_row->>'is_active')::boolean, true),
      v_sort
    );

    v_idx := v_idx + 1;
  END LOOP;
END;
$function$;

-- place_order — 옵션 라벨 생성만 option_values 기반으로 교체 (20261003b 기준 전문)
CREATE OR REPLACE FUNCTION public.place_order(
  p_store_id character varying,
  p_address_id uuid,
  p_items jsonb,
  p_reward_type character varying,
  p_discount_percent integer DEFAULT NULL
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
  v_sku_id uuid;
  v_option_label character varying;
  v_has_skus boolean;
  v_sku_price_delta integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT s.store_code, s.shipping_fee_type, s.shipping_fee_amount, s.shipping_free_threshold, s.popup_ends_at
  INTO v_store_code, v_fee_type, v_fee_amount, v_free_threshold, v_popup_ends_at
  FROM public.stores s
  WHERE s.id = p_store_id
  FOR UPDATE;

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
    v_has_skus := public.product_has_active_skus(v_product_id);

    IF v_has_skus THEN
      v_sku_id := NULLIF(v_item->>'sku_id', '')::uuid;
      IF v_sku_id IS NULL THEN
        RAISE EXCEPTION 'sku_required';
      END IF;
      SELECT ps.stock_quantity
      INTO v_stock
      FROM public.product_skus ps
      WHERE ps.id = v_sku_id
        AND ps.product_id = v_product_id
        AND ps.is_active = true;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_sku';
      END IF;
    ELSE
      v_sku_id := NULL;
    END IF;

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
    v_has_skus := public.product_has_active_skus(v_product_id);
    v_sku_id := NULL;
    v_option_label := NULL;
    v_sku_price_delta := 0;

    IF v_has_skus THEN
      v_sku_id := NULLIF(v_item->>'sku_id', '')::uuid;
      IF v_sku_id IS NULL THEN
        RAISE EXCEPTION 'sku_required';
      END IF;

      SELECT public.format_sku_option_label(ps.option_values), ps.price_delta
      INTO v_option_label, v_sku_price_delta
      FROM public.product_skus ps
      WHERE ps.id = v_sku_id
        AND ps.product_id = v_product_id
        AND ps.is_active = true;

      IF v_option_label IS NULL THEN
        RAISE EXCEPTION 'invalid_sku';
      END IF;

      UPDATE public.product_skus ps
      SET stock_quantity = ps.stock_quantity - v_quantity
      WHERE ps.id = v_sku_id
        AND ps.stock_quantity >= v_quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_stock';
      END IF;

      v_product_price := v_product_price + COALESCE(v_sku_price_delta, 0);
      IF v_product_price < 0 THEN
        RAISE EXCEPTION 'invalid_price';
      END IF;
    ELSE
      UPDATE public.products p
      SET stock_quantity = p.stock_quantity - v_quantity,
          updated_at = now()
      WHERE p.id = v_product_id
        AND p.stock_quantity >= v_quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_stock';
      END IF;
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
    IF v_effective_mode = 'discount_only' AND v_effective_discount > 0 THEN
      v_line_discount := v_effective_discount;
    ELSIF p_reward_type = 'discount'
          AND v_effective_mode = 'choice'
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

    INSERT INTO public.order_items (
      order_id, product_id, quantity, unit_price, line_discount_percent, product_sku_id, option_label
    )
    VALUES (
      v_order_id, v_product_id, v_quantity, v_product_price, NULLIF(v_line_discount, 0), v_sku_id, v_option_label
    );

    IF v_can_auto AND NOT (v_product_id = ANY (v_seen_products)) THEN
      UPDATE public.products p
      SET auto_accept_remaining = p.auto_accept_remaining - 1,
          updated_at = now()
      WHERE p.id = v_product_id
        AND p.auto_accept_enabled = true
        AND p.auto_accept_remaining > 0;

      IF FOUND THEN
        v_seen_products := array_append(v_seen_products, v_product_id);
      ELSE
        v_can_auto := false;
        UPDATE public.orders
        SET status = 'awaiting_accept',
            auto_accepted = false,
            accepted_at = NULL
        WHERE id = v_order_id;
      END IF;
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
      discount_percent = CASE
        WHEN v_order_discount_percent IS NOT NULL AND p_reward_type IN ('discount', 'gacha')
        THEN v_order_discount_percent
        ELSE NULL
      END
  WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_final_total, v_discounted_subtotal, v_shipping_fee, v_order_number, v_store_code;
END;
$function$;

REVOKE ALL ON FUNCTION public.format_sku_option_label(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.format_sku_option_label(jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_product_skus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_skus(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_owner_product_skus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_product_skus(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.save_owner_product_skus(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_owner_product_skus(uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.place_order(character varying, uuid, jsonb, character varying, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(character varying, uuid, jsonb, character varying, integer) TO authenticated;
