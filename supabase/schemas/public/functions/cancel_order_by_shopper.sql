CREATE OR REPLACE FUNCTION public.cancel_order_by_shopper (
  p_order_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_user_id uuid; v_status character varying; v_auto boolean; v_owner_id uuid; v_store_id character varying; v_order_number integer; v_store_code character varying; BEGIN SELECT o.user_id, o.status, o.auto_accepted, o.store_id, o.order_number, st.store_code INTO v_user_id, v_status, v_auto, v_store_id, v_order_number, v_store_code FROM public.orders o JOIN public.stores st ON st.id = o.store_id WHERE o.id = p_order_id; IF v_user_id IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF; IF v_user_id <> auth.uid() THEN RAISE EXCEPTION 'not_order_owner'; END IF; IF v_status NOT IN ('awaiting_accept', 'accepted', 'on_hold') THEN RAISE EXCEPTION 'invalid_order_state'; END IF; IF EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL) THEN RAISE EXCEPTION 'already_shipped'; END IF; PERFORM public._restore_order_stock(p_order_id); PERFORM public._restore_gacha_roll(p_order_id); IF v_auto THEN PERFORM public._restore_auto_accept_quota(p_order_id); END IF; UPDATE public.orders o SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'shopper', hold_reason_code = NULL, hold_reason_text = NULL, hold_requested_at = NULL, hold_affected_item_ids = NULL WHERE o.id = p_order_id; SELECT s.owner_id INTO v_owner_id FROM public.stores s WHERE s.id = v_store_id; PERFORM public._enqueue_order_notification(v_owner_id, p_order_id, 'order_cancelled_by_shopper', '주문 취소', format('주문 %s-%s을 고객이 취소했어요.', v_store_code, v_order_number)); END; $function$;

GRANT EXECUTE ON FUNCTION "public"."cancel_order_by_shopper"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."cancel_order_by_shopper"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."cancel_order_by_shopper"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."cancel_order_by_shopper"(uuid) FROM PUBLIC, "anon", "service_role";
