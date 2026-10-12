CREATE OR REPLACE FUNCTION public.set_display_fixture_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."set_display_fixture_updated_at"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."set_display_fixture_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_display_fixture_updated_at"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."set_display_fixture_updated_at"() FROM "anon", "authenticated", "service_role";
