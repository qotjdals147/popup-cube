-- AD-087 — 옵션별 추가·할인 금액 (쿠팡·스마트스토어 스타일) · place_order 반영

ALTER TABLE public.product_skus
  ADD COLUMN IF NOT EXISTS price_delta integer NOT NULL DEFAULT 0;

ALTER TABLE public.product_skus
  DROP CONSTRAINT IF EXISTS product_skus_price_delta_range;

ALTER TABLE public.product_skus
  ADD CONSTRAINT product_skus_price_delta_range CHECK (price_delta >= -5000000 AND price_delta <= 5000000);

CREATE OR REPLACE FUNCTION public.get_product_skus(p_product_id uuid)
RETURNS TABLE(
  sku_id uuid,
  color character varying,
  size character varying,
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
    ps.color,
    ps.size,
    public.format_product_sku_label(ps.color, ps.size),
    ps.stock_quantity,
    ps.price_delta,
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
  color character varying,
  size character varying,
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
    ps.color,
    ps.size,
    public.format_product_sku_label(ps.color, ps.size),
    ps.stock_quantity,
    ps.price_delta,
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
  v_row jsonb;
  v_color character varying;
  v_size character varying;
  v_stock integer;
  v_price_delta integer;
  v_sort smallint;
  v_idx integer := 0;
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
    v_color := NULLIF(btrim(v_row->>'color'), '');
    v_size := NULLIF(btrim(v_row->>'size'), '');
    v_stock := GREATEST(0, COALESCE((v_row->>'stock_quantity')::integer, 0));
    v_price_delta := COALESCE((v_row->>'price_delta')::integer, 0);
    v_sort := COALESCE((v_row->>'sort_order')::smallint, v_idx::smallint);

    IF v_color IS NULL AND v_size IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.product_skus (product_id, color, size, stock_quantity, price_delta, is_active, sort_order)
    VALUES (
      p_product_id,
      v_color,
      v_size,
      v_stock,
      v_price_delta,
      COALESCE((v_row->>'is_active')::boolean, true),
      v_sort
    );

    v_idx := v_idx + 1;
  END LOOP;
END;
$function$;
