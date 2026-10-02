-- ISS-044 / 045 / 046 / 049 — §63 audit fixes (AD-086 follow-up)
-- ISS-048 / 051 (place_order) → 20261002b_iss_place_order_lock.sql

-- ISS-044: restore SKU stock when order_items.product_sku_id is set
CREATE OR REPLACE FUNCTION public._restore_order_stock(p_order_id uuid)
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

-- ISS-045 / ISS-049: block direct REST updates (RPC-only workflow)
DROP POLICY IF EXISTS orders_update_own ON public.orders;
REVOKE UPDATE ON TABLE public.orders FROM authenticated;
REVOKE UPDATE ON TABLE public.orders FROM anon;

DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM anon;

-- ISS-046: internal notification helper — not callable from clients
REVOKE ALL ON FUNCTION public._enqueue_order_notification(uuid, uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._enqueue_order_notification(uuid, uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public._enqueue_order_notification(uuid, uuid, text, text, text) FROM authenticated;
