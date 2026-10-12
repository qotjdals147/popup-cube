CREATE OR REPLACE FUNCTION public.get_store_product_sales (
  p_store_id character varying,
  p_limit    integer           DEFAULT 8
)
  RETURNS TABLE (
    product_id   uuid,
    product_name text,
    image_url    text,
    option_label text,
    units_sold   bigint,
    revenue      bigint
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
    NULLIF(trim(oi.option_label), '')::text AS option_label,
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
  GROUP BY pr.id, pr.name, pr.image_url, NULLIF(trim(oi.option_label), '')
  HAVING COALESCE(SUM(oi.quantity), 0) > 0
  ORDER BY revenue DESC, units_sold DESC, pr.name ASC, option_label ASC NULLS FIRST
  LIMIT v_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_store_product_sales"(character varying, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."get_store_product_sales"(character varying, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_store_product_sales"(character varying, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_store_product_sales"(character varying, integer) FROM PUBLIC, "anon", "service_role";
