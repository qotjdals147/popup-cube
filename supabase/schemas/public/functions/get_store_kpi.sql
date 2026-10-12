CREATE OR REPLACE FUNCTION public.get_store_kpi (
  p_store_id character varying
)
  RETURNS TABLE (
    popup_started_at            timestamp with time zone,
    popup_ends_at               timestamp with time zone,
    today_order_count           integer,
    today_revenue               bigint,
    popup_order_count           integer,
    popup_revenue               bigint,
    pending_accept              integer,
    awaiting_ship               integer,
    on_hold                     integer,
    low_stock_count             integer,
    auto_accept_exhausted_count integer
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_popup_start timestamptz;
  v_popup_end timestamptz;
  v_today date := (now() AT TIME ZONE 'Asia/Seoul')::date;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  SELECT s.created_at, s.popup_ends_at
  INTO v_popup_start, v_popup_end
  FROM public.stores s
  WHERE s.id = p_store_id;

  RETURN QUERY
  WITH valid_orders AS (
    SELECT o.id, o.total_amount, o.created_at, o.status
    FROM public.orders o
    WHERE o.store_id = p_store_id
      AND o.status NOT IN ('rejected', 'cancelled')
      AND (o.created_at AT TIME ZONE 'Asia/Seoul')::date >= (v_popup_start AT TIME ZONE 'Asia/Seoul')::date
      AND (
        v_popup_end IS NULL
        OR (o.created_at AT TIME ZONE 'Asia/Seoul')::date <= (v_popup_end AT TIME ZONE 'Asia/Seoul')::date
      )
  ),
  today_orders AS (
    SELECT vo.*
    FROM valid_orders vo
    WHERE (vo.created_at AT TIME ZONE 'Asia/Seoul')::date = v_today
  ),
  counts AS (
    SELECT * FROM public.get_store_order_counts(p_store_id) LIMIT 1
  )
  SELECT
    v_popup_start,
    v_popup_end,
    (SELECT COUNT(*)::integer FROM today_orders),
    COALESCE((SELECT SUM(total_amount)::bigint FROM today_orders), 0),
    (SELECT COUNT(*)::integer FROM valid_orders),
    COALESCE((SELECT SUM(total_amount)::bigint FROM valid_orders), 0),
    c.pending_accept,
    c.awaiting_ship,
    c.on_hold,
    (
      SELECT COUNT(*)::integer
      FROM public.products p
      WHERE p.store_id = p_store_id
        AND p.is_active = true
        AND p.stock_quantity < 10
    ),
    (
      SELECT COUNT(*)::integer
      FROM public.products p
      WHERE p.store_id = p_store_id
        AND p.is_active = true
        AND p.auto_accept_enabled = true
        AND p.auto_accept_remaining <= 0
    )
  FROM counts c;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_store_kpi"(character varying) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."get_store_kpi"(character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_store_kpi"(character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_store_kpi"(character varying) FROM PUBLIC, "anon", "service_role";
