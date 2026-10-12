CREATE OR REPLACE FUNCTION public.get_owner_product_skus (
  p_product_id uuid
)
  RETURNS TABLE (
    sku_id         uuid,
    option_values  jsonb,
    option_label   character varying,
    stock_quantity integer,
    price_delta    integer,
    is_active      boolean,
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

GRANT EXECUTE ON FUNCTION "public"."get_owner_product_skus"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."get_owner_product_skus"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_owner_product_skus"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_owner_product_skus"(uuid) FROM PUBLIC, "anon", "service_role";
