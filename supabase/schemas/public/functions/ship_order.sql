CREATE OR REPLACE FUNCTION public.ship_order (
  p_order_id        uuid,
  p_tracking_number character varying DEFAULT NULL::character varying
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE v_store_id character varying;
BEGIN
  SELECT o.store_id INTO v_store_id FROM public.orders o WHERE o.id = p_order_id;
  IF v_store_id IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF;
  UPDATE public.orders o SET status = 'shipped', tracking_number = p_tracking_number, shipped_at = now() WHERE o.id = p_order_id AND o.status = 'accepted';
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_order_state'; END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."ship_order"(uuid, character varying) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."ship_order"(uuid, character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ship_order"(uuid, character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."ship_order"(uuid, character varying) FROM PUBLIC, "anon", "service_role";
