-- AD-084 · §58 #8 P1 — 점주 KPI + 상품별 판매 통계 (팝업 기간 · mock PG)

CREATE OR REPLACE FUNCTION public.get_store_kpi(p_store_id character varying)
RETURNS TABLE(
  popup_started_at timestamptz,
  popup_ends_at timestamptz,
  today_order_count integer,
  today_revenue bigint,
  popup_order_count integer,
  popup_revenue bigint,
  pending_accept integer,
  awaiting_ship integer,
  on_hold integer,
  low_stock_count integer,
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

CREATE OR REPLACE FUNCTION public.get_store_sales_daily(
  p_store_id character varying,
  p_days integer DEFAULT 7
)
RETURNS TABLE(
  sales_day date,
  order_count integer,
  revenue bigint
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

CREATE OR REPLACE FUNCTION public.get_store_product_sales(
  p_store_id character varying,
  p_limit integer DEFAULT 8
)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  image_url text,
  units_sold bigint,
  revenue bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_popup_start timestamptz;
  v_popup_end timestamptz;
  v_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 8), 50));
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
  SELECT
    pr.id AS product_id,
    pr.name::text AS product_name,
    pr.image_url::text AS image_url,
    COALESCE(SUM(oi.quantity), 0)::bigint AS units_sold,
    COALESCE(
      SUM(
        ROUND(
          oi.unit_price * oi.quantity * (100 - COALESCE(oi.line_discount_percent, 0)) / 100.0
        )
      ),
      0
    )::bigint AS revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.products pr ON pr.id = oi.product_id
  WHERE o.store_id = p_store_id
    AND o.status NOT IN ('rejected', 'cancelled')
    AND (o.created_at AT TIME ZONE 'Asia/Seoul')::date >= (v_popup_start AT TIME ZONE 'Asia/Seoul')::date
    AND (
      v_popup_end IS NULL
      OR (o.created_at AT TIME ZONE 'Asia/Seoul')::date <= (v_popup_end AT TIME ZONE 'Asia/Seoul')::date
    )
  GROUP BY pr.id, pr.name, pr.image_url
  HAVING COALESCE(SUM(oi.quantity), 0) > 0
  ORDER BY revenue DESC, units_sold DESC, pr.name ASC
  LIMIT v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_store_kpi(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_kpi(character varying) TO authenticated;

REVOKE ALL ON FUNCTION public.get_store_sales_daily(character varying, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_sales_daily(character varying, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_store_product_sales(character varying, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_product_sales(character varying, integer) TO authenticated;
