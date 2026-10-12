CREATE OR REPLACE FUNCTION public.complete_delivery (
  p_order_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_store_id character varying;
  v_status character varying;
BEGIN
  SELECT o.store_id, o.status INTO v_store_id, v_status
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

  IF v_status <> 'shipped' THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  UPDATE public.orders o
  SET status = 'delivery_completed', delivery_completed_at = now()
  WHERE o.id = p_order_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."complete_delivery"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."complete_delivery"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."complete_delivery"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."complete_delivery"(uuid) FROM PUBLIC, "anon", "service_role";
