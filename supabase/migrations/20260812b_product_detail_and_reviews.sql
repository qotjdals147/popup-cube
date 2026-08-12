-- §54 — 상품 상세페이지 + 리뷰(별점/사진) (구매확정 게이트)

-- 1) products — 직접 글로 쓰는 상세설명 (긴 이미지 대신/함께 사용 가능)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS detail_description text;

-- 2) 상세페이지 이미지 (여러 장, 위에서 아래로 쌓아 표시 — 세로로 긴 상세컷 지원)
CREATE TABLE IF NOT EXISTS public.product_detail_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_detail_images_product_id_idx ON public.product_detail_images(product_id);

-- 3) 리뷰 (구매확정된 주문건당 상품 1개에 1개 — RPC로만 생성)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON public.product_reviews(user_id);

CREATE TABLE IF NOT EXISTS public.product_review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_review_images_review_id_idx ON public.product_review_images(review_id);

-- 4) RLS — product_detail_images: display_fixtures와 동일 패턴 (공개 매장은 손님도 읽기, 점주는 본인 매장 전체 CRUD)
ALTER TABLE public.product_detail_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_detail_images_public_read ON public.product_detail_images;
CREATE POLICY product_detail_images_public_read ON public.product_detail_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_images.product_id
        AND p.is_active = true
        AND s.is_active = true
        AND s.status = 'published'
    )
  );

DROP POLICY IF EXISTS product_detail_images_owner_read ON public.product_detail_images;
CREATE POLICY product_detail_images_owner_read ON public.product_detail_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_images.product_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS product_detail_images_owner_insert ON public.product_detail_images;
CREATE POLICY product_detail_images_owner_insert ON public.product_detail_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_images.product_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS product_detail_images_owner_update ON public.product_detail_images;
CREATE POLICY product_detail_images_owner_update ON public.product_detail_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_images.product_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_images.product_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS product_detail_images_owner_delete ON public.product_detail_images;
CREATE POLICY product_detail_images_owner_delete ON public.product_detail_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_images.product_id
        AND s.owner_id = auth.uid()
    )
  );

GRANT SELECT ON public.product_detail_images TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_detail_images TO authenticated;

-- 5) RLS — product_reviews / product_review_images: 읽기는 공개, 쓰기는 오직 RPC(SECURITY DEFINER)로만
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_reviews_public_read ON public.product_reviews;
CREATE POLICY product_reviews_public_read ON public.product_reviews
  FOR SELECT
  USING (true);

GRANT SELECT ON public.product_reviews TO anon, authenticated;

ALTER TABLE public.product_review_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_review_images_public_read ON public.product_review_images;
CREATE POLICY product_review_images_public_read ON public.product_review_images
  FOR SELECT
  USING (true);

GRANT SELECT ON public.product_review_images TO anon, authenticated;

-- 6) create_product_review — 구매확정(purchase_confirmed/completed)된 주문의 상품에만 리뷰 작성 허용
CREATE OR REPLACE FUNCTION public.create_product_review(
  p_order_id uuid,
  p_product_id uuid,
  p_rating integer,
  p_body text,
  p_image_urls text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_order_status character varying;
  v_review_id uuid;
  v_url text;
  v_idx integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'invalid_rating';
  END IF;

  IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
    RAISE EXCEPTION 'empty_body';
  END IF;

  SELECT o.status INTO v_order_status
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.id = p_order_id AND o.user_id = v_user_id AND oi.product_id = p_product_id
  LIMIT 1;

  IF v_order_status IS NULL THEN
    RAISE EXCEPTION 'order_item_not_found';
  END IF;

  IF v_order_status NOT IN ('purchase_confirmed', 'completed') THEN
    RAISE EXCEPTION 'purchase_not_confirmed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.product_reviews
    WHERE order_id = p_order_id AND product_id = p_product_id
  ) THEN
    RAISE EXCEPTION 'already_reviewed';
  END IF;

  INSERT INTO public.product_reviews (product_id, order_id, user_id, rating, body)
  VALUES (p_product_id, p_order_id, v_user_id, p_rating, trim(p_body))
  RETURNING id INTO v_review_id;

  IF p_image_urls IS NOT NULL THEN
    FOREACH v_url IN ARRAY p_image_urls[1:5]
    LOOP
      IF v_url IS NOT NULL AND length(trim(v_url)) > 0 THEN
        INSERT INTO public.product_review_images (review_id, image_url, sort_order)
        VALUES (v_review_id, v_url, v_idx);
        v_idx := v_idx + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN v_review_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_product_review(uuid, uuid, integer, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_product_review(uuid, uuid, integer, text, text[]) TO authenticated;

-- 7) get_product_reviews — 상품 상세페이지에서 공개 조회 (사진 배열 포함)
CREATE OR REPLACE FUNCTION public.get_product_reviews(p_product_id uuid)
RETURNS TABLE(
  review_id uuid,
  rating integer,
  body text,
  created_at timestamptz,
  reviewer_nickname character varying,
  image_urls text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    r.id, r.rating::integer, r.body, r.created_at, prf.nickname,
    COALESCE(
      (SELECT array_agg(ri.image_url ORDER BY ri.sort_order)
       FROM public.product_review_images ri
       WHERE ri.review_id = r.id),
      ARRAY[]::text[]
    )
  FROM public.product_reviews r
  LEFT JOIN public.profiles prf ON prf.id = r.user_id
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_product_reviews(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_reviews(uuid) TO anon, authenticated;

-- 8) get_my_review_keys — 손님이 이미 리뷰를 남긴 (주문, 상품) 조합 (내 주문 화면에서 버튼 상태 판단용)
CREATE OR REPLACE FUNCTION public.get_my_review_keys()
RETURNS TABLE(order_id uuid, product_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.order_id, r.product_id
  FROM public.product_reviews r
  WHERE r.user_id = auth.uid();
END;
$function$;

REVOKE ALL ON FUNCTION public.get_my_review_keys() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_review_keys() TO authenticated;
