CREATE OR REPLACE FUNCTION public.list_my_notifications (
  p_limit integer DEFAULT 50
)
  RETURNS TABLE (
    id           uuid,
    order_id     uuid,
    event_type   character varying,
    title        text,
    body         text,
    read_at      timestamp with time zone,
    created_at   timestamp with time zone,
    store_code   character varying,
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

GRANT EXECUTE ON FUNCTION "public"."list_my_notifications"(integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."list_my_notifications"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."list_my_notifications"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."list_my_notifications"(integer) FROM PUBLIC, "anon", "service_role";
