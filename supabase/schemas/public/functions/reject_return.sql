CREATE OR REPLACE FUNCTION public.reject_return (
  p_return_id uuid,
  p_reply     text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_order_id uuid; v_status character varying; v_store_id character varying; v_reply text := trim(p_reply); BEGIN SELECT r.order_id, r.status, r.store_id INTO v_order_id, v_status, v_store_id FROM public.order_returns r WHERE r.id = p_return_id; IF v_order_id IS NULL THEN RAISE EXCEPTION 'return_not_found'; END IF; IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; IF v_status <> 'requested' THEN RAISE EXCEPTION 'invalid_return_state'; END IF; IF v_reply IS NULL OR length(v_reply) = 0 THEN RAISE EXCEPTION 'empty_message'; END IF; IF length(v_reply) > 1000 THEN RAISE EXCEPTION 'message_too_long'; END IF; UPDATE public.order_returns SET status = 'rejected', owner_reply = v_reply, resolved_at = now() WHERE id = p_return_id; UPDATE public.orders SET return_status = 'rejected', return_resolved_at = now(), return_owner_reply = v_reply, active_return_id = NULL WHERE id = v_order_id; END; $function$;

GRANT EXECUTE ON FUNCTION "public"."reject_return"(uuid, text) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."reject_return"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."reject_return"(uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."reject_return"(uuid, text) FROM "anon", "authenticated", "service_role";
