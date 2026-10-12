CREATE OR REPLACE FUNCTION public.approve_return (
  p_return_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_order_id uuid; v_status character varying; v_store_id character varying; BEGIN SELECT r.order_id, r.status, r.store_id INTO v_order_id, v_status, v_store_id FROM public.order_returns r WHERE r.id = p_return_id; IF v_order_id IS NULL THEN RAISE EXCEPTION 'return_not_found'; END IF; IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; IF v_status <> 'requested' THEN RAISE EXCEPTION 'invalid_return_state'; END IF; UPDATE public.order_returns SET status = 'approved' WHERE id = p_return_id; UPDATE public.orders SET return_status = 'approved' WHERE id = v_order_id; END; $function$;

GRANT EXECUTE ON FUNCTION "public"."approve_return"(uuid) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."approve_return"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."approve_return"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."approve_return"(uuid) FROM "anon", "authenticated", "service_role";
