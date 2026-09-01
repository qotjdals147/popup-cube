-- AD-073 R2 — 반품 증빙 사진 URL

ALTER TABLE public.order_returns
  ADD COLUMN IF NOT EXISTS evidence_urls text[] DEFAULT '{}'::text[];

CREATE OR REPLACE FUNCTION public.request_return(
  p_order_id uuid,
  p_kind character varying,
  p_reason_code character varying,
  p_reason_detail text,
  p_items jsonb,
  p_exchange_memo text DEFAULT NULL,
  p_evidence_urls text[] DEFAULT '{}'::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_store_id character varying;
  v_status character varying;
  v_return_status character varying;
  v_reward_type character varying;
  v_kind character varying := lower(trim(p_kind));
  v_reason character varying := lower(trim(p_reason_code));
  v_detail text := nullif(trim(p_reason_detail), '');
  v_memo text := nullif(trim(p_exchange_memo), '');
  v_items jsonb := COALESCE(p_items, '[]'::jsonb);
  v_evidence text[] := COALESCE(p_evidence_urls, '{}'::text[]);
  v_return_id uuid;
  v_mind_allowed boolean;
  v_mind_days integer;
  v_exchange_allowed boolean;
  v_anchor timestamptz;
  v_has_gacha boolean;
  v_recipient character varying;
  v_phone character varying;
  v_postal character varying;
  v_line1 character varying;
  v_line2 character varying;
  v_item record;
BEGIN
  SELECT o.user_id, o.store_id, o.status, o.return_status, o.reward_type,
         COALESCE(o.purchase_confirmed_at, o.delivery_completed_at, o.shipped_at)
  INTO v_user_id, v_store_id, v_status, v_return_status, v_reward_type, v_anchor
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;

  IF v_return_status IN ('requested', 'approved') THEN
    RAISE EXCEPTION 'return_already_active';
  END IF;

  IF v_kind NOT IN ('return', 'exchange') THEN
    RAISE EXCEPTION 'invalid_return_kind';
  END IF;

  IF v_reason NOT IN ('change_of_mind', 'defective', 'wrong_delivery', 'other') THEN
    RAISE EXCEPTION 'invalid_reason_code';
  END IF;

  IF v_reason = 'other' AND v_detail IS NULL THEN
    RAISE EXCEPTION 'reason_detail_required';
  END IF;

  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'empty_items';
  END IF;

  SELECT s.return_change_of_mind_allowed, s.return_change_of_mind_days, s.exchange_allowed,
         s.return_recipient_name, s.return_phone, s.return_postal_code,
         s.return_address_line1, s.return_address_line2
  INTO v_mind_allowed, v_mind_days, v_exchange_allowed,
       v_recipient, v_phone, v_postal, v_line1, v_line2
  FROM public.stores s
  WHERE s.id = v_store_id;

  IF v_kind = 'exchange' AND NOT COALESCE(v_exchange_allowed, true) THEN
    RAISE EXCEPTION 'exchange_not_allowed';
  END IF;

  IF v_reason = 'change_of_mind' THEN
    IF NOT COALESCE(v_mind_allowed, true) THEN
      RAISE EXCEPTION 'change_of_mind_not_allowed';
    END IF;
    IF v_anchor IS NOT NULL AND COALESCE(v_mind_days, 7) >= 0 THEN
      IF now() > v_anchor + (COALESCE(v_mind_days, 7) || ' days')::interval THEN
        RAISE EXCEPTION 'change_of_mind_expired';
      END IF;
    END IF;
  END IF;

  IF v_recipient IS NULL OR v_line1 IS NULL THEN
    RAISE EXCEPTION 'return_address_missing';
  END IF;

  FOR v_item IN
    SELECT elem
    FROM jsonb_array_elements(v_items) AS elem
  LOOP
    IF (v_item.elem->>'order_item_id') IS NULL OR (v_item.elem->>'quantity') IS NULL THEN
      RAISE EXCEPTION 'invalid_item_payload';
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM public.order_items oi
      WHERE oi.id = (v_item.elem->>'order_item_id')::uuid
        AND oi.order_id = p_order_id
        AND oi.quantity >= GREATEST(1, (v_item.elem->>'quantity')::integer)
    ) THEN
      RAISE EXCEPTION 'invalid_order_item';
    END IF;
  END LOOP;

  SELECT EXISTS (SELECT 1 FROM public.gacha_rolls gr WHERE gr.order_id = p_order_id)
  INTO v_has_gacha;

  INSERT INTO public.order_returns (
    order_id, store_id, user_id, kind, reason_code, reason_detail, status, items,
    exchange_memo, evidence_urls,
    return_recipient_name, return_phone, return_postal_code, return_address_line1, return_address_line2,
    gacha_return_status, requested_at
  ) VALUES (
    p_order_id, v_store_id, v_user_id, v_kind, v_reason, v_detail, 'requested', v_items,
    CASE WHEN v_kind = 'exchange' THEN v_memo ELSE NULL END,
    v_evidence,
    v_recipient, v_phone, v_postal, v_line1, v_line2,
    CASE WHEN v_has_gacha THEN 'pending' ELSE NULL END,
    now()
  )
  RETURNING id INTO v_return_id;

  UPDATE public.orders o
  SET return_status = 'requested',
      return_kind = v_kind,
      return_reason_code = v_reason,
      return_reason_detail = v_detail,
      return_requested_at = now(),
      active_return_id = v_return_id
  WHERE o.id = p_order_id;

  RETURN v_return_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_return(p_order_id uuid)
RETURNS TABLE(
  return_id uuid,
  order_id uuid,
  kind character varying,
  reason_code character varying,
  reason_detail text,
  status character varying,
  items jsonb,
  exchange_memo text,
  evidence_urls text[],
  return_recipient_name character varying,
  return_phone character varying,
  return_postal_code character varying,
  return_address_line1 character varying,
  return_address_line2 character varying,
  gacha_return_status character varying,
  owner_reply text,
  requested_at timestamptz,
  resolved_at timestamptz
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
    r.id,
    r.order_id,
    r.kind,
    r.reason_code,
    r.reason_detail,
    r.status,
    r.items,
    r.exchange_memo,
    COALESCE(r.evidence_urls, '{}'::text[]),
    r.return_recipient_name,
    r.return_phone,
    r.return_postal_code,
    r.return_address_line1,
    r.return_address_line2,
    r.gacha_return_status,
    r.owner_reply,
    r.requested_at,
    r.resolved_at
  FROM public.order_returns r
  WHERE r.order_id = p_order_id
  ORDER BY r.requested_at DESC
  LIMIT 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_return(uuid, character varying, character varying, text, jsonb, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_return(uuid, character varying, character varying, text, jsonb, text, text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.get_order_return(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_return(uuid) TO authenticated;
