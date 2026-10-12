CREATE OR REPLACE FUNCTION public.count_my_unread_notifications()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT COUNT(*)::integer INTO v_count
  FROM public.order_notifications n
  WHERE n.user_id = auth.uid()
    AND n.read_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."count_my_unread_notifications"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."count_my_unread_notifications"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."count_my_unread_notifications"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."count_my_unread_notifications"() FROM PUBLIC, "anon", "service_role";
