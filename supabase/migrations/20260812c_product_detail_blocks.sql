-- §56 (AD-060) — 상품 상세페이지 블록 에디터: 글/이미지 블록을 하나의 순서 배열로 관리.
-- 기존 detail_description(글 1개) + product_detail_images(사진 목록)를 대체하는 상위 모델.
-- 레거시 컬럼/테이블은 남겨두되(백업), 앞으로는 이 테이블만 읽고 쓴다.

CREATE TABLE IF NOT EXISTS public.product_detail_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  block_type text NOT NULL CHECK (block_type IN ('text', 'image')),
  text_content text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_detail_blocks_content_chk CHECK (
    (block_type = 'text' AND text_content IS NOT NULL) OR
    (block_type = 'image' AND image_url IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS product_detail_blocks_product_id_idx
  ON public.product_detail_blocks(product_id, sort_order);

-- RLS — product_detail_images와 동일 패턴 (공개 매장은 손님도 읽기, 점주는 본인 매장 상품 전체 CRUD)
ALTER TABLE public.product_detail_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_detail_blocks_public_read ON public.product_detail_blocks;
CREATE POLICY product_detail_blocks_public_read ON public.product_detail_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_blocks.product_id
        AND p.is_active = true
        AND s.is_active = true
        AND s.status = 'published'
    )
  );

DROP POLICY IF EXISTS product_detail_blocks_owner_read ON public.product_detail_blocks;
CREATE POLICY product_detail_blocks_owner_read ON public.product_detail_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_blocks.product_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS product_detail_blocks_owner_insert ON public.product_detail_blocks;
CREATE POLICY product_detail_blocks_owner_insert ON public.product_detail_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_blocks.product_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS product_detail_blocks_owner_update ON public.product_detail_blocks;
CREATE POLICY product_detail_blocks_owner_update ON public.product_detail_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_blocks.product_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_blocks.product_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS product_detail_blocks_owner_delete ON public.product_detail_blocks;
CREATE POLICY product_detail_blocks_owner_delete ON public.product_detail_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_detail_blocks.product_id
        AND s.owner_id = auth.uid()
    )
  );

GRANT SELECT ON public.product_detail_blocks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_detail_blocks TO authenticated;

-- 1회 데이터 이전: detail_description → 글 블록 1개, product_detail_images → 이미지 블록들(순서 유지).
-- 이미 블록이 있는 상품은 건너뜀 (재실행 안전).
DO $$
DECLARE
  r RECORD;
  v_next_order integer;
BEGIN
  FOR r IN
    SELECT p.id, p.detail_description
    FROM public.products p
    WHERE (p.detail_description IS NOT NULL AND length(trim(p.detail_description)) > 0)
       OR EXISTS (SELECT 1 FROM public.product_detail_images di WHERE di.product_id = p.id)
  LOOP
    IF EXISTS (SELECT 1 FROM public.product_detail_blocks b WHERE b.product_id = r.id) THEN
      CONTINUE;
    END IF;

    v_next_order := 0;

    IF r.detail_description IS NOT NULL AND length(trim(r.detail_description)) > 0 THEN
      INSERT INTO public.product_detail_blocks (product_id, sort_order, block_type, text_content)
      VALUES (r.id, v_next_order, 'text', r.detail_description);
      v_next_order := v_next_order + 1;
    END IF;

    INSERT INTO public.product_detail_blocks (product_id, sort_order, block_type, image_url)
    SELECT r.id, v_next_order + (row_number() OVER (ORDER BY di.sort_order) - 1), 'image', di.image_url
    FROM public.product_detail_images di
    WHERE di.product_id = r.id;
  END LOOP;
END $$;
