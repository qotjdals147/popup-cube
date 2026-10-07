-- ISS-063 — save_owner_product_skus: 주문(order_items)이 참조하는 SKU DELETE 시 FK 실패
-- 조치: DELETE ALL ❌ → 라벨 기준 UPDATE/INSERT · 미사용 SKU만 DELETE · 주문 참조 SKU는 is_active=false

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
  v_label_key text;
  v_stock integer;
  v_delta integer;
  v_sort smallint;
  v_idx integer := 0;
  v_seen text[] := ARRAY[]::text[];
  v_kept_ids uuid[] := ARRAY[]::uuid[];
  v_matched_id uuid;
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

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_raw := v_row->'option_values';

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

    v_label_key := lower(v_label::text);
    IF v_label_key = ANY (v_seen) THEN
      CONTINUE;
    END IF;
    v_seen := array_append(v_seen, v_label_key);

    v_stock := GREATEST(0, COALESCE((v_row->>'stock_quantity')::integer, 0));
    v_delta := COALESCE((v_row->>'price_delta')::integer, 0);
    v_sort := COALESCE((v_row->>'sort_order')::smallint, v_idx::smallint);

    v_matched_id := NULL;
    SELECT ps.id
    INTO v_matched_id
    FROM public.product_skus ps
    WHERE ps.product_id = p_product_id
      AND lower(public.format_sku_option_label(ps.option_values)::text) = v_label_key
    ORDER BY ps.created_at ASC
    LIMIT 1;

    IF v_matched_id IS NOT NULL THEN
      UPDATE public.product_skus ps
      SET
        option_values = v_values,
        stock_quantity = v_stock,
        price_delta = v_delta,
        is_active = true,
        sort_order = v_sort
      WHERE ps.id = v_matched_id;
    ELSE
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
      )
      RETURNING id INTO v_matched_id;
    END IF;

    v_kept_ids := array_append(v_kept_ids, v_matched_id);
    v_idx := v_idx + 1;
  END LOOP;

  UPDATE public.product_skus ps
  SET is_active = false
  WHERE ps.product_id = p_product_id
    AND NOT (ps.id = ANY (v_kept_ids))
    AND EXISTS (
      SELECT 1 FROM public.order_items oi WHERE oi.product_sku_id = ps.id
    );

  DELETE FROM public.product_skus ps
  WHERE ps.product_id = p_product_id
    AND NOT (ps.id = ANY (v_kept_ids))
    AND NOT EXISTS (
      SELECT 1 FROM public.order_items oi WHERE oi.product_sku_id = ps.id
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_owner_product_skus(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_owner_product_skus(uuid, jsonb) TO authenticated;
