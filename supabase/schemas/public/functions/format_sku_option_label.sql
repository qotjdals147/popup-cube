CREATE OR REPLACE FUNCTION public.format_sku_option_label (
  p_option_values jsonb
)
  RETURNS character varying
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."format_sku_option_label"(jsonb) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."format_sku_option_label"(jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."format_sku_option_label"(jsonb) TO "postgres";

REVOKE ALL ON FUNCTION "public"."format_sku_option_label"(jsonb) FROM PUBLIC, "service_role";
