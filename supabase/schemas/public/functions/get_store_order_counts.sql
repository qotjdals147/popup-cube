CREATE OR REPLACE FUNCTION public.get_store_order_counts (
  p_store_id character varying
)
  RETURNS TABLE (
    pending_accept integer,
    awaiting_ship  integer,
    on_hold        integer,
    open_claims    integer,
    open_returns   integer
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; RETURN QUERY SELECT COUNT(*) FILTER (WHERE o.status IN ('awaiting_accept', 'pending', 'paid'))::integer, COUNT(*) FILTER (WHERE o.status = 'accepted')::integer, COUNT(*) FILTER (WHERE o.status = 'on_hold')::integer, COUNT(*) FILTER (WHERE o.claim_status = 'open')::integer, COUNT(*) FILTER (WHERE o.return_status = 'requested')::integer FROM public.orders o WHERE o.store_id = p_store_id AND o.status NOT IN ('rejected', 'cancelled'); END; $function$;

GRANT EXECUTE ON FUNCTION "public"."get_store_order_counts"(character varying) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."get_store_order_counts"(character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_store_order_counts"(character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_store_order_counts"(character varying) FROM "anon", "authenticated", "service_role";
