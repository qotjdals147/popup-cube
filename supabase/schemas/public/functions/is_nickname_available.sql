CREATE OR REPLACE FUNCTION public.is_nickname_available (
  p_nickname text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select not exists (
    select 1 from public.profiles where lower(nickname) = lower(p_nickname)
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."is_nickname_available"(text) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."is_nickname_available"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_nickname_available"(text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."is_nickname_available"(text) FROM "service_role";
