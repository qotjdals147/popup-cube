-- ISS-067 / 068 / 069 / 070 / 071 — §63.15 2차 중간 감사 D단계 (User 2026-10-27)
-- 1차 ISS-044~055는 재수정하지 않음.

-- ── ISS-070: 주문 없이 가챠 뽑기 차단 ──
DROP FUNCTION IF EXISTS public.roll_gacha(character varying);
DROP FUNCTION IF EXISTS public.roll_gacha(character varying, uuid);

CREATE OR REPLACE FUNCTION public.roll_gacha(
  p_store_id character varying,
  p_order_id uuid
)
RETURNS TABLE (
  entry_id            uuid,
  product_id          uuid,
  product_name        character varying,
  product_image_url   text,
  exclusive_name      character varying,
  exclusive_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pool_id uuid;
  v_total_weight integer;
  v_rand numeric;
  v_entry_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND o.store_id = p_store_id
      AND o.user_id = auth.uid()
      AND o.reward_type = 'gacha'
  ) THEN
    RAISE EXCEPTION 'invalid_gacha_order';
  END IF;

  IF EXISTS (SELECT 1 FROM public.gacha_rolls gr WHERE gr.order_id = p_order_id) THEN
    RAISE EXCEPTION 'gacha_already_rolled';
  END IF;

  SELECT gp.id INTO v_pool_id
  FROM public.gacha_pools gp
  WHERE gp.store_id = p_store_id AND gp.linked_product_id IS NULL AND gp.is_active = TRUE
  LIMIT 1;

  IF v_pool_id IS NULL THEN
    RAISE EXCEPTION 'no_active_pool';
  END IF;

  SELECT coalesce(sum(gpe.weight), 0) INTO v_total_weight
  FROM public.gacha_pool_entries gpe
  WHERE gpe.pool_id = v_pool_id AND gpe.is_active = TRUE;

  IF v_total_weight <= 0 THEN
    RAISE EXCEPTION 'empty_pool';
  END IF;

  v_rand := floor(random() * v_total_weight) + 1;

  SELECT gpe.id INTO v_entry_id
  FROM (
    SELECT gpe2.id, sum(gpe2.weight) OVER (ORDER BY gpe2.created_at, gpe2.id) AS running_weight
    FROM public.gacha_pool_entries gpe2
    WHERE gpe2.pool_id = v_pool_id AND gpe2.is_active = TRUE
  ) gpe
  WHERE gpe.running_weight >= v_rand
  ORDER BY gpe.running_weight
  LIMIT 1;

  INSERT INTO public.gacha_rolls (user_id, store_id, pool_entry_id, order_id)
  VALUES (auth.uid(), p_store_id, v_entry_id, p_order_id);

  RETURN QUERY
  SELECT
    e.id,
    e.product_id,
    p.name,
    p.image_url,
    e.exclusive_name,
    e.exclusive_image_url
  FROM public.gacha_pool_entries e
  LEFT JOIN public.products p ON p.id = e.product_id
  WHERE e.id = v_entry_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.roll_gacha(character varying, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.roll_gacha(character varying, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.roll_gacha(character varying, uuid) TO authenticated;

-- ── ISS-067: 손님 REST 가짜 주문 INSERT 차단 (주문 생성은 place_order만) ──
DROP POLICY IF EXISTS orders_insert_own ON public.orders;
DROP POLICY IF EXISTS order_items_insert_own ON public.order_items;
REVOKE INSERT ON TABLE public.orders FROM authenticated;
REVOKE INSERT ON TABLE public.orders FROM anon;
REVOKE INSERT ON TABLE public.order_items FROM authenticated;
REVOKE INSERT ON TABLE public.order_items FROM anon;

-- ── ISS-068: 반품 완료(입고·검수) 시 신청 품목만 재고 복구. ISS-044 _restore_order_stock는 그대로. ──
CREATE OR REPLACE FUNCTION public._restore_return_stock(p_return_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oi.product_id,
           oi.product_sku_id,
           GREATEST(1, COALESCE((elem->>'quantity')::integer, 1)) AS quantity
    FROM public.order_returns ret
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ret.items, '[]'::jsonb)) AS elem
    JOIN public.order_items oi
      ON oi.id = (elem->>'order_item_id')::uuid
     AND oi.order_id = ret.order_id
    WHERE ret.id = p_return_id
  LOOP
    IF r.product_sku_id IS NOT NULL THEN
      UPDATE public.product_skus ps
      SET stock_quantity = ps.stock_quantity + r.quantity,
          updated_at = now()
      WHERE ps.id = r.product_sku_id;
    ELSE
      UPDATE public.products p
      SET stock_quantity = p.stock_quantity + r.quantity,
          updated_at = now()
      WHERE p.id = r.product_id;
    END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public._restore_return_stock(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._restore_return_stock(uuid) FROM anon;
REVOKE ALL ON FUNCTION public._restore_return_stock(uuid) FROM authenticated;

CREATE OR REPLACE FUNCTION public.complete_return(p_return_id uuid)
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

  PERFORM public._restore_return_stock(p_return_id);

  UPDATE public.order_returns
  SET status = 'completed', resolved_at = now()
  WHERE id = p_return_id;

  UPDATE public.orders
  SET return_status = 'completed',
      return_resolved_at = now(),
      active_return_id = NULL
  WHERE id = v_order_id;
END;
$function$;

-- ── ISS-071: 반품 RPC는 로그인 점주만 호출 ──
REVOKE ALL ON FUNCTION public.approve_return(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_return(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_return(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_return(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_return(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_return(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_return(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_return(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_return(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.set_gacha_return_status(uuid, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_gacha_return_status(uuid, character varying) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_gacha_return_status(uuid, character varying) TO authenticated;

-- ── ISS-069: 반품 증빙 전용 private 버킷 ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'return-evidence',
  'return-evidence',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS return_evidence_insert_own ON storage.objects;
DROP POLICY IF EXISTS return_evidence_select ON storage.objects;

CREATE POLICY return_evidence_insert_own ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'return-evidence'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY return_evidence_select ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'return-evidence'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR EXISTS (
        SELECT 1
        FROM public.order_returns r
        JOIN public.stores s ON s.id = r.store_id
        WHERE s.owner_id = auth.uid()
          AND name = ANY (r.evidence_urls)
      )
    )
  );
