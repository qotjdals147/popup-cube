CREATE OR REPLACE FUNCTION public._enqueue_order_notification (
  p_user_id    uuid,
  p_order_id   uuid,
  p_event_type text,
  p_title      text,
  p_body       text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ BEGIN IF p_user_id IS NULL THEN RETURN; END IF; INSERT INTO public.order_notifications (user_id, order_id, event_type, title, body) VALUES (p_user_id, p_order_id, p_event_type, p_title, p_body); END; $function$;

REVOKE ALL ON FUNCTION "public"."_enqueue_order_notification"(uuid, uuid, text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."_enqueue_order_notification"(uuid, uuid, text, text, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."_enqueue_order_notification"(uuid, uuid, text, text, text) FROM PUBLIC, "anon", "authenticated", "service_role";
