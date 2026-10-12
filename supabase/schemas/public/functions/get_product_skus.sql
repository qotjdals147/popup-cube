CREATE OR REPLACE FUNCTION public.get_product_skus (
  p_product_id uuid
)
  RETURNS TABLE (
    sku_id         uuid,
    option_values  jsonb,
    option_label   character varying,
    stock_quantity integer,
    price_delta    integer,
    sort_order     smallint
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

GRANT EXECUTE ON FUNCTION "public"."get_product_skus"(uuid) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_product_skus"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_product_skus"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_product_skus"(uuid) FROM PUBLIC, "service_role";
