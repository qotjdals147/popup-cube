CREATE OR REPLACE FUNCTION public.mark_notification_read (
  p_notification_id uuid
)
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
  WHERE n.id = p_notification_id
    AND n.user_id = auth.uid()
    AND n.read_at IS NULL;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."mark_notification_read"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."mark_notification_read"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."mark_notification_read"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."mark_notification_read"(uuid) FROM PUBLIC, "anon", "service_role";
