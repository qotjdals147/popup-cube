-- AD-076 — 손님 알림 목록 RPC (list · read · unread count)

CREATE OR REPLACE FUNCTION public.list_my_notifications(p_limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid,
  order_id uuid,
  event_type character varying,
  title text,
  body text,
  read_at timestamptz,
  created_at timestamptz,
  store_code character varying,
  order_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.order_id,
    n.event_type,
    n.title,
    n.body,
    n.read_at,
    n.created_at,
    s.store_code,
    o.order_number
  FROM public.order_notifications n
  LEFT JOIN public.orders o ON o.id = n.order_id
  LEFT JOIN public.stores s ON s.id = o.store_id
  WHERE n.user_id = auth.uid()
  ORDER BY n.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
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

REVOKE ALL ON FUNCTION public.list_my_notifications(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_notifications(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

REVOKE ALL ON FUNCTION public.count_my_unread_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_my_unread_notifications() TO authenticated;
