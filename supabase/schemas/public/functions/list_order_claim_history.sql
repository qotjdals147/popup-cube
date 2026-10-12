CREATE OR REPLACE FUNCTION public.list_order_claim_history (
  p_order_id uuid
)
  RETURNS TABLE (
    round_no           integer,
    shopper_message    text,
    owner_reply        text,
    shopper_created_at timestamp with time zone,
    owner_replied_at   timestamp with time zone,
    status             character varying
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_user_id uuid;
  v_store_id character varying;
BEGIN
  SELECT o.user_id, o.store_id
  INTO v_user_id, v_store_id
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF auth.uid() <> v_user_id AND NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    m.round_no,
    m.shopper_message,
    m.owner_reply,
    m.shopper_created_at,
    m.owner_replied_at,
    m.status
  FROM public.order_claim_messages m
  WHERE m.order_id = p_order_id
  ORDER BY m.round_no ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."list_order_claim_history"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."list_order_claim_history"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."list_order_claim_history"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."list_order_claim_history"(uuid) FROM PUBLIC, "anon", "service_role";
