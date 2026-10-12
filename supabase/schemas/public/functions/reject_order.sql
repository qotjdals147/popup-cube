CREATE OR REPLACE FUNCTION public.reject_order (
  p_order_id    uuid,
  p_reason_code character varying DEFAULT NULL::character varying,
  p_reason_memo text              DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_store_id character varying; v_user_id uuid; v_status character varying; v_auto boolean; v_order_number integer; v_store_code character varying; v_memo text := NULLIF(trim(p_reason_memo), ''); BEGIN SELECT o.store_id, o.user_id, o.status, o.auto_accepted, o.order_number, st.store_code INTO v_store_id, v_user_id, v_status, v_auto, v_order_number, v_store_code FROM public.orders o JOIN public.stores st ON st.id = o.store_id WHERE o.id = p_order_id; IF v_store_id IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF; IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; IF v_status NOT IN ('awaiting_accept', 'accepted', 'on_hold') THEN RAISE EXCEPTION 'invalid_order_state'; END IF; IF v_status = 'accepted' AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL) THEN RAISE EXCEPTION 'already_shipped'; END IF; IF p_reason_code IS NOT NULL AND p_reason_code NOT IN ('line_stock_short', 'gacha_prize_oos', 'address_issue', 'policy_violation', 'cannot_fulfill', 'other') THEN RAISE EXCEPTION 'invalid_reason_code'; END IF; PERFORM public._restore_order_stock(p_order_id); PERFORM public._restore_gacha_roll(p_order_id); IF v_auto THEN PERFORM public._restore_auto_accept_quota(p_order_id); END IF; UPDATE public.orders o SET status = 'rejected', reject_reason_code = p_reason_code, reject_reason_text = v_memo, hold_reason_code = NULL, hold_reason_text = NULL, hold_requested_at = NULL, hold_affected_item_ids = NULL WHERE o.id = p_order_id; PERFORM public._enqueue_order_notification(v_user_id, p_order_id, 'order_rejected', '주문 취소 안내', format('주문 %s-%s이 취소됐어요.%s', v_store_code, v_order_number, CASE WHEN v_memo IS NOT NULL THEN ' 사유: ' || v_memo ELSE '' END)); END; $function$;

GRANT EXECUTE ON FUNCTION "public"."reject_order"(uuid, character varying, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."reject_order"(uuid, character varying, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."reject_order"(uuid, character varying, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."reject_order"(uuid, character varying, text) FROM PUBLIC, "anon", "service_role";
