CREATE OR REPLACE FUNCTION public.get_store_sales_daily (
  p_store_id character varying,
  p_days     integer           DEFAULT 7
)
  RETURNS TABLE (
    sales_day   date,
    order_count integer,
    revenue     bigint
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_popup_start timestamptz;
  v_popup_end timestamptz;
  v_days integer := GREATEST(1, LEAST(COALESCE(p_days, 7), 31));
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
  WITH day_series AS (
    SELECT (v_today - offs)::date AS d
    FROM generate_series(0, v_days - 1) AS offs
  ),
  valid_orders AS (
    SELECT
      (o.created_at AT TIME ZONE 'Asia/Seoul')::date AS d,
      o.total_amount
    FROM public.orders o
    WHERE o.store_id = p_store_id
      AND o.status NOT IN ('rejected', 'cancelled')
      AND (o.created_at AT TIME ZONE 'Asia/Seoul')::date >= (v_popup_start AT TIME ZONE 'Asia/Seoul')::date
      AND (
        v_popup_end IS NULL
        OR (o.created_at AT TIME ZONE 'Asia/Seoul')::date <= (v_popup_end AT TIME ZONE 'Asia/Seoul')::date
      )
      AND (o.created_at AT TIME ZONE 'Asia/Seoul')::date >= (v_today - (v_days - 1))
  )
  SELECT
    ds.d AS sales_day,
    COUNT(vo.d)::integer AS order_count,
    COALESCE(SUM(vo.total_amount), 0)::bigint AS revenue
  FROM day_series ds
  LEFT JOIN valid_orders vo ON vo.d = ds.d
  GROUP BY ds.d
  ORDER BY ds.d ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_store_sales_daily"(character varying, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."get_store_sales_daily"(character varying, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_store_sales_daily"(character varying, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_store_sales_daily"(character varying, integer) FROM PUBLIC, "anon", "service_role";
