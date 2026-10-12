CREATE OR REPLACE FUNCTION public.product_has_active_skus (
  p_product_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.product_skus ps
    WHERE ps.product_id = p_product_id
      AND ps.is_active = true
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."product_has_active_skus"(uuid) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."product_has_active_skus"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."product_has_active_skus"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."product_has_active_skus"(uuid) FROM "anon", "authenticated", "service_role";
