CREATE OR REPLACE FUNCTION public.confirm_purchase (
  p_order_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_user_id uuid;
  v_status character varying;
BEGIN
  SELECT o.user_id, o.status INTO v_user_id, v_status
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_status NOT IN ('shipped', 'delivery_completed') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  UPDATE public.orders o
  SET status = 'purchase_confirmed',
      purchase_confirmed_at = now(),
      purchase_confirm_auto = false
  WHERE o.id = p_order_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."confirm_purchase"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."confirm_purchase"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."confirm_purchase"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."confirm_purchase"(uuid) FROM PUBLIC, "anon", "service_role";
