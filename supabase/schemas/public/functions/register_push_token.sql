CREATE OR REPLACE FUNCTION public.register_push_token (
  p_expo_push_token text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF; IF p_expo_push_token IS NULL OR length(trim(p_expo_push_token)) = 0 THEN RAISE EXCEPTION 'empty_token'; END IF; INSERT INTO public.user_push_tokens (user_id, expo_push_token, updated_at) VALUES (auth.uid(), trim(p_expo_push_token), now()) ON CONFLICT (user_id) DO UPDATE SET expo_push_token = EXCLUDED.expo_push_token, updated_at = now(); END; $function$;

GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."register_push_token"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."register_push_token"(text) FROM PUBLIC, "anon", "service_role";
