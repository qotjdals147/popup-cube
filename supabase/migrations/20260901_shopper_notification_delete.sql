-- AD-076 — 손님 알림 삭제 RPC (개별 · 읽은 알림 일괄 · 전체)

CREATE OR REPLACE FUNCTION public.delete_my_notification(p_notification_id uuid)
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

CREATE OR REPLACE FUNCTION public.delete_all_my_notifications()
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
  WHERE n.user_id = auth.uid();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN COALESCE(v_deleted, 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_my_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_notification(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_read_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_read_notifications() TO authenticated;

REVOKE ALL ON FUNCTION public.delete_all_my_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_all_my_notifications() TO authenticated;
