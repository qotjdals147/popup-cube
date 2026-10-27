CREATE OR REPLACE FUNCTION public.set_gacha_return_status (
  p_return_id uuid,
  p_status    character varying
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_store_id character varying; v_gacha_status character varying; v_new_status character varying := lower(trim(p_status)); BEGIN SELECT r.store_id, r.gacha_return_status INTO v_store_id, v_gacha_status FROM public.order_returns r WHERE r.id = p_return_id; IF v_store_id IS NULL THEN RAISE EXCEPTION 'return_not_found'; END IF; IF v_gacha_status IS NULL THEN RAISE EXCEPTION 'no_gacha_on_order'; END IF; IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; IF v_new_status NOT IN ('pending', 'returned', 'not_returnable') THEN RAISE EXCEPTION 'invalid_gacha_status'; END IF; UPDATE public.order_returns SET gacha_return_status = v_new_status, gacha_returned_at = CASE WHEN v_new_status = 'returned' THEN now() ELSE gacha_returned_at END WHERE id = p_return_id; END; $function$;

REVOKE ALL ON FUNCTION "public"."set_gacha_return_status"(uuid, character varying) FROM PUBLIC, "anon";

GRANT EXECUTE ON FUNCTION "public"."set_gacha_return_status"(uuid, character varying) TO "authenticated";
