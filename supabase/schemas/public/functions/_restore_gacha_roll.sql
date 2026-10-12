CREATE OR REPLACE FUNCTION public._restore_gacha_roll (
  p_order_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_temp'
  AS $function$ BEGIN DELETE FROM public.gacha_rolls gr WHERE gr.order_id = p_order_id; END; $function$;

GRANT EXECUTE ON FUNCTION "public"."_restore_gacha_roll"(uuid) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."_restore_gacha_roll"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."_restore_gacha_roll"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."_restore_gacha_roll"(uuid) FROM "anon", "authenticated", "service_role";
