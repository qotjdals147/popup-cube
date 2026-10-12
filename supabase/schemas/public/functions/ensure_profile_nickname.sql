CREATE OR REPLACE FUNCTION public.ensure_profile_nickname()
  RETURNS character varying
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth', 'pg_temp'
  AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  RETURN public._ensure_profile_nickname_for(auth.uid());
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."ensure_profile_nickname"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."ensure_profile_nickname"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ensure_profile_nickname"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."ensure_profile_nickname"() FROM PUBLIC, "anon", "service_role";
