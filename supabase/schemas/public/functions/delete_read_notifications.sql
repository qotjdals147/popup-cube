CREATE OR REPLACE FUNCTION public.delete_read_notifications()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_deleted integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  DELETE FROM public.order_notifications n
  WHERE n.user_id = auth.uid()
    AND n.read_at IS NOT NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN COALESCE(v_deleted, 0);
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."delete_read_notifications"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."delete_read_notifications"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."delete_read_notifications"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."delete_read_notifications"() FROM PUBLIC, "anon", "service_role";
