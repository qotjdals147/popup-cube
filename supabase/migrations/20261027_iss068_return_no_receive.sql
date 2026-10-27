-- ISS-068 보완 — 물건을 회수하지 않는 반품 완료 (User 2026-10-27)
-- 입고 완료 = 재고 복구 · 회수 없이 완료 = 재고 그대로

ALTER TABLE public.order_returns
  ADD COLUMN IF NOT EXISTS stock_restored boolean;

DROP FUNCTION IF EXISTS public.complete_return(uuid);

CREATE OR REPLACE FUNCTION public.complete_return(
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

REVOKE ALL ON FUNCTION public.complete_return(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_return(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_return(uuid, boolean) TO authenticated;

DROP FUNCTION IF EXISTS public.get_order_return(uuid);

CREATE OR REPLACE FUNCTION public.get_order_return(p_order_id uuid)
RETURNS TABLE (
  return_id             uuid,
  order_id              uuid,
  kind                  character varying,
  reason_code           character varying,
  reason_detail         text,
  status                character varying,
  items                 jsonb,
  exchange_memo         text,
  evidence_urls         text[],
  return_recipient_name character varying,
  return_phone          character varying,
  return_postal_code    character varying,
  return_address_line1  character varying,
  return_address_line2  character varying,
  gacha_return_status   character varying,
  owner_reply           text,
  requested_at          timestamp with time zone,
  resolved_at           timestamp with time zone,
  stock_restored        boolean
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
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'order_item_id', elem->>'order_item_id',
            'quantity', GREATEST(1, (elem->>'quantity')::integer),
            'product_name', COALESCE(NULLIF(elem->>'product_name', ''), p.name),
            'option_label', COALESCE(NULLIF(elem->>'option_label', ''), oi.option_label)
          )
          ORDER BY (elem->>'order_item_id')
        ),
        '[]'::jsonb
      )
      FROM jsonb_array_elements(r.items) AS elem
      LEFT JOIN public.order_items oi
        ON oi.id = (elem->>'order_item_id')::uuid
      LEFT JOIN public.products p ON p.id = oi.product_id
    ) AS items,
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
    r.resolved_at,
    r.stock_restored
  FROM public.order_returns r
  WHERE r.order_id = p_order_id
  ORDER BY r.requested_at DESC
  LIMIT 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_order_return(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_order_return(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_order_return(uuid) TO authenticated;
