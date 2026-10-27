CREATE OR REPLACE FUNCTION public._restore_return_stock (
  p_return_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oi.product_id,
           oi.product_sku_id,
           GREATEST(1, COALESCE((elem->>'quantity')::integer, 1)) AS quantity
    FROM public.order_returns ret
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ret.items, '[]'::jsonb)) AS elem
    JOIN public.order_items oi
      ON oi.id = (elem->>'order_item_id')::uuid
     AND oi.order_id = ret.order_id
    WHERE ret.id = p_return_id
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

REVOKE ALL ON FUNCTION "public"."_restore_return_stock"(uuid) FROM PUBLIC, "anon", "authenticated";
