CREATE OR REPLACE FUNCTION public.store_has_active_gacha_pool (
  p_store_id character varying
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."store_has_active_gacha_pool"(character varying) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."store_has_active_gacha_pool"(character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."store_has_active_gacha_pool"(character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."store_has_active_gacha_pool"(character varying) FROM PUBLIC, "service_role";
