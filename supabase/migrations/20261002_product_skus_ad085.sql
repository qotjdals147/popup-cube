-- AD-085 · §58 P1 — 상품 옵션 (색·사이즈 SKU)

CREATE TABLE IF NOT EXISTS public.product_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color character varying(40),
  size character varying(40),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_skus_option_present CHECK (
    NULLIF(btrim(COALESCE(color, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(size, '')), '') IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS product_skus_product_id_idx ON public.product_skus (product_id);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_sku_id uuid REFERENCES public.product_skus(id),
  ADD COLUMN IF NOT EXISTS option_label character varying(120);

CREATE OR REPLACE FUNCTION public.format_product_sku_label(p_color character varying, p_size character varying)
RETURNS character varying
LANGUAGE sql
IMMUTABLE
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

CREATE OR REPLACE FUNCTION public.product_has_active_skus(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.product_skus ps
    WHERE ps.product_id = p_product_id
      AND ps.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_product_skus(p_product_id uuid)
RETURNS TABLE(
  sku_id uuid,
  color character varying,
  size character varying,
  option_label character varying,
  stock_quantity integer,
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
    v_sort := COALESCE((v_row->>'sort_order')::smallint, v_idx::smallint);

    IF v_color IS NULL AND v_size IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.product_skus (product_id, color, size, stock_quantity, is_active, sort_order)
    VALUES (
      p_product_id,
      v_color,
      v_size,
      v_stock,
      COALESCE((v_row->>'is_active')::boolean, true),
      v_sort
    );

    v_idx := v_idx + 1;
  END LOOP;
END;
$function$;

ALTER TABLE public.product_skus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_skus_public_read ON public.product_skus;
CREATE POLICY product_skus_public_read ON public.product_skus
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_skus.product_id AND p.is_active = true
    )
  );

REVOKE ALL ON FUNCTION public.get_product_skus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_skus(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_owner_product_skus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_product_skus(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.save_owner_product_skus(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_owner_product_skus(uuid, jsonb) TO authenticated;
