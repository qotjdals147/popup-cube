CREATE OR REPLACE FUNCTION public._recalculate_order_totals (
  p_order_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_store_id character varying; v_fee_type character varying; v_fee_amount integer; v_free_threshold integer; v_discounted_subtotal integer; v_shipping_fee integer; v_final_total integer; BEGIN SELECT o.store_id INTO v_store_id FROM public.orders o WHERE o.id = p_order_id; IF v_store_id IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF; SELECT s.shipping_fee_type, s.shipping_fee_amount, s.shipping_free_threshold INTO v_fee_type, v_fee_amount, v_free_threshold FROM public.stores s WHERE s.id = v_store_id; SELECT COALESCE(SUM(ROUND(oi.unit_price * oi.quantity * (100 - COALESCE(oi.line_discount_percent, 0)) / 100.0)), 0)::integer INTO v_discounted_subtotal FROM public.order_items oi WHERE oi.order_id = p_order_id; IF v_discounted_subtotal <= 0 THEN RAISE EXCEPTION 'no_valid_items'; END IF; v_shipping_fee := public.calc_store_shipping_fee(v_fee_type, v_fee_amount, v_free_threshold, v_discounted_subtotal); v_final_total := v_discounted_subtotal + v_shipping_fee; UPDATE public.orders o SET subtotal_amount = v_discounted_subtotal, shipping_fee = v_shipping_fee, total_amount = v_final_total WHERE o.id = p_order_id; END; $function$;

GRANT EXECUTE ON FUNCTION "public"."_recalculate_order_totals"(uuid) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."_recalculate_order_totals"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."_recalculate_order_totals"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."_recalculate_order_totals"(uuid) FROM "anon", "authenticated", "service_role";
