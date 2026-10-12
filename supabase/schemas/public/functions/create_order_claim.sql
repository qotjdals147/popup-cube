CREATE OR REPLACE FUNCTION public.create_order_claim (
  p_order_id uuid,
  p_message  text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_user_id uuid;
  v_status character varying;
  v_claim_status character varying;
  v_message text := trim(p_message);
  v_round integer;
BEGIN
  SELECT o.user_id, o.status, o.claim_status
  INTO v_user_id, v_status, v_claim_status
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_status NOT IN ('shipped', 'delivery_completed', 'purchase_confirmed', 'completed') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  IF v_claim_status = 'open' THEN
    RAISE EXCEPTION 'claim_already_open';
  END IF;

  IF v_message IS NULL OR length(v_message) = 0 THEN
    RAISE EXCEPTION 'empty_message';
  END IF;

  IF length(v_message) > 1000 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;

  SELECT COALESCE(MAX(m.round_no), 0) + 1
  INTO v_round
  FROM public.order_claim_messages m
  WHERE m.order_id = p_order_id;

  INSERT INTO public.order_claim_messages (
    order_id, round_no, shopper_message, shopper_created_at, status
  ) VALUES (
    p_order_id, v_round, v_message, now(), 'open'
  );

  UPDATE public.orders o
  SET claim_status = 'open',
      claim_message = v_message,
      claim_reply = NULL,
      claim_created_at = now(),
      claim_resolved_at = NULL,
      claim_round_count = v_round
  WHERE o.id = p_order_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."create_order_claim"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."create_order_claim"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_order_claim"(uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."create_order_claim"(uuid, text) FROM PUBLIC, "anon", "service_role";
