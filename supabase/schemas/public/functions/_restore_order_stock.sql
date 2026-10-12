CREATE OR REPLACE FUNCTION public._restore_order_stock (
  p_order_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oi.product_id, oi.quantity, oi.product_sku_id
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    IF r.product_sku_id IS NOT NULL THEN
      UPDATE public.product_skus ps
      SET stock_quantity = ps.stock_quantity + r.quantity,
          updated_at = now()
      WHERE ps.id = r.product_sku_id;
    ELSE
      UPDATE public.products p
      SET stock_quantity = p.stock_quantity + r.quantity,
          updated_at = now()
      WHERE p.id = r.product_id;
    END IF;
  END LOOP;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."_restore_order_stock"(uuid) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."_restore_order_stock"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."_restore_order_stock"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."_restore_order_stock"(uuid) FROM "anon", "authenticated", "service_role";
