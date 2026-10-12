CREATE OR REPLACE FUNCTION public.hold_order (
  p_order_id          uuid,
  p_reason_code       character varying,
  p_reason_memo       text              DEFAULT NULL::text,
  p_affected_item_ids uuid[]            DEFAULT NULL::uuid[]
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_store_id character varying; v_user_id uuid; v_status character varying; v_order_number integer; v_store_code character varying; v_memo text := NULLIF(trim(p_reason_memo), ''); BEGIN SELECT o.store_id, o.user_id, o.status, o.order_number, st.store_code INTO v_store_id, v_user_id, v_status, v_order_number, v_store_code FROM public.orders o JOIN public.stores st ON st.id = o.store_id WHERE o.id = p_order_id; IF v_store_id IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF; IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; IF v_status NOT IN ('awaiting_accept', 'accepted') THEN RAISE EXCEPTION 'invalid_order_state'; END IF; IF EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL) THEN RAISE EXCEPTION 'already_shipped'; END IF; IF p_reason_code NOT IN ('address_issue', 'line_stock_short', 'gacha_prize_oos', 'other') THEN RAISE EXCEPTION 'invalid_reason_code'; END IF; IF p_reason_code = 'line_stock_short' THEN IF p_affected_item_ids IS NULL OR cardinality(p_affected_item_ids) = 0 THEN RAISE EXCEPTION 'affected_items_required'; END IF; IF EXISTS (SELECT 1 FROM unnest(p_affected_item_ids) AS aid(id) WHERE NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.id = aid.id AND oi.order_id = p_order_id)) THEN RAISE EXCEPTION 'invalid_affected_items'; END IF; END IF; IF p_reason_code = 'other' AND v_memo IS NULL THEN RAISE EXCEPTION 'memo_required'; END IF; UPDATE public.orders o SET status = 'on_hold', hold_reason_code = p_reason_code, hold_reason_text = v_memo, hold_requested_at = now(), hold_affected_item_ids = p_affected_item_ids, supplement_submitted_at = NULL, accepted_at = NULL WHERE o.id = p_order_id; PERFORM public._enqueue_order_notification(v_user_id, p_order_id, 'order_on_hold', '주문 수정 요청', format('주문 %s-%s 수정이 필요해요. 앱에서 확인해 주세요.', v_store_code, v_order_number)); END; $function$;

GRANT EXECUTE ON FUNCTION "public"."hold_order"(uuid, character varying, text, uuid[]) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."hold_order"(uuid, character varying, text, uuid[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hold_order"(uuid, character varying, text, uuid[]) TO "postgres";

REVOKE ALL ON FUNCTION "public"."hold_order"(uuid, character varying, text, uuid[]) FROM PUBLIC, "anon", "service_role";
