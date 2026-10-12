CREATE OR REPLACE FUNCTION public.resolve_order_claim (
  p_order_id uuid,
  p_reply    text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_store_id character varying;
  v_claim_status character varying;
  v_reply text := trim(p_reply);
  v_updated integer;
BEGIN
  SELECT o.store_id, o.claim_status
  INTO v_store_id, v_claim_status
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_claim_status <> 'open' THEN
    RAISE EXCEPTION 'invalid_claim_state';
  END IF;

  IF v_reply IS NULL OR length(v_reply) = 0 THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  IF length(v_reply) > 1000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  UPDATE public.order_claim_messages m
  SET owner_reply = v_reply,
      owner_replied_at = now(),
      status = 'resolved'
  WHERE m.order_id = p_order_id AND m.status = 'open';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'invalid_claim_state';
  END IF;

  UPDATE public.orders o
  SET claim_status = 'resolved',
      claim_reply = v_reply,
      claim_resolved_at = now()
  WHERE o.id = p_order_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."resolve_order_claim"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."resolve_order_claim"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."resolve_order_claim"(uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."resolve_order_claim"(uuid, text) FROM PUBLIC, "anon", "service_role";
