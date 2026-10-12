CREATE OR REPLACE FUNCTION public.update_product_fulfillment (
  p_product_id          uuid,
  p_stock_quantity      integer,
  p_auto_accept_enabled boolean,
  p_auto_accept_limit   integer
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE v_store_id character varying; v_old_limit integer; v_old_rem integer; v_new_rem integer;
BEGIN
  SELECT p.store_id, p.auto_accept_limit, p.auto_accept_remaining INTO v_store_id, v_old_limit, v_old_rem FROM public.products p WHERE p.id = p_product_id;
  IF v_store_id IS NULL THEN RAISE EXCEPTION 'product_not_found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF;
  IF p_stock_quantity < 0 OR p_auto_accept_limit < 0 THEN RAISE EXCEPTION 'invalid_values'; END IF;
  IF p_auto_accept_enabled AND p_auto_accept_limit <= 0 THEN RAISE EXCEPTION 'auto_accept_limit_required'; END IF;
  IF NOT p_auto_accept_enabled THEN v_new_rem := 0;
  ELSIF p_auto_accept_limit > v_old_limit THEN v_new_rem := v_old_rem + (p_auto_accept_limit - v_old_limit);
  ELSIF p_auto_accept_limit < v_old_limit THEN v_new_rem := LEAST(v_old_rem, p_auto_accept_limit);
  ELSE v_new_rem := v_old_rem; END IF;
  IF p_auto_accept_enabled AND v_new_rem <= 0 THEN v_new_rem := p_auto_accept_limit; END IF;
  UPDATE public.products p SET stock_quantity = p_stock_quantity, auto_accept_enabled = p_auto_accept_enabled,
    auto_accept_limit = CASE WHEN p_auto_accept_enabled THEN p_auto_accept_limit ELSE 0 END,
    auto_accept_remaining = CASE WHEN p_auto_accept_enabled THEN v_new_rem ELSE 0 END, updated_at = now() WHERE p.id = p_product_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."update_product_fulfillment"(uuid, integer, boolean, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."update_product_fulfillment"(uuid, integer, boolean, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_product_fulfillment"(uuid, integer, boolean, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."update_product_fulfillment"(uuid, integer, boolean, integer) FROM PUBLIC, "anon", "service_role";
