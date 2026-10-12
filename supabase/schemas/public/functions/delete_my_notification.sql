CREATE OR REPLACE FUNCTION public.delete_my_notification (
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

  DELETE FROM public.order_notifications n
  WHERE n.id = p_notification_id
    AND n.user_id = auth.uid();
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."delete_my_notification"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."delete_my_notification"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."delete_my_notification"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."delete_my_notification"(uuid) FROM PUBLIC, "anon", "service_role";
