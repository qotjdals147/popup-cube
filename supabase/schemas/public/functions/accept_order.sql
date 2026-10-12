CREATE OR REPLACE FUNCTION public.accept_order (
  p_order_id uuid
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
  UPDATE public.orders o SET status = 'accepted', accepted_at = now() WHERE o.id = p_order_id AND o.status = 'awaiting_accept';
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_order_state'; END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."accept_order"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."accept_order"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."accept_order"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."accept_order"(uuid) FROM PUBLIC, "anon", "service_role";
