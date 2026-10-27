CREATE OR REPLACE FUNCTION public.complete_return (
  p_return_id uuid,
  p_restore_stock boolean DEFAULT true
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_order_id uuid;
  v_status character varying;
  v_store_id character varying;
  v_gacha_status character varying;
  v_restore boolean := COALESCE(p_restore_stock, true);
BEGIN
  SELECT r.order_id, r.status, r.store_id, r.gacha_return_status
  INTO v_order_id, v_status, v_store_id, v_gacha_status
  FROM public.order_returns r
  WHERE r.id = p_return_id;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'return_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'invalid_return_state';
  END IF;

  IF v_gacha_status = 'pending' THEN
    RAISE EXCEPTION 'gacha_return_pending';
  END IF;

  IF v_restore THEN
    PERFORM public._restore_return_stock(p_return_id);
  END IF;

  UPDATE public.order_returns
  SET status = 'completed',
      resolved_at = now(),
      stock_restored = v_restore
  WHERE id = p_return_id;

  UPDATE public.orders
  SET return_status = 'completed',
      return_resolved_at = now(),
      active_return_id = NULL
  WHERE id = v_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."complete_return"(uuid, boolean) FROM PUBLIC, "anon";

GRANT EXECUTE ON FUNCTION "public"."complete_return"(uuid, boolean) TO "authenticated";
