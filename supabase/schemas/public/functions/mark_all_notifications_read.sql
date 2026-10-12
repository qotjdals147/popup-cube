CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.order_notifications n
  SET read_at = now()
  WHERE n.user_id = auth.uid()
    AND n.read_at IS NULL;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."mark_all_notifications_read"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."mark_all_notifications_read"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."mark_all_notifications_read"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."mark_all_notifications_read"() FROM PUBLIC, "anon", "service_role";
