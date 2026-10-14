-- AD-088 — 매장 새 소식: 이미지/GIF · 상품 링크 · 손님 캐러셀

ALTER TABLE public.store_news_posts
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS link_product_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_news_posts_link_product_id_fkey'
  ) THEN
    ALTER TABLE public.store_news_posts
      ADD CONSTRAINT store_news_posts_link_product_id_fkey
      FOREIGN KEY (link_product_id) REFERENCES public.products (id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.store_news_posts DROP CONSTRAINT IF EXISTS store_news_posts_title_trim;

ALTER TABLE public.store_news_posts ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.store_news_posts ALTER COLUMN title SET DEFAULT '';

UPDATE public.store_news_posts SET title = '' WHERE title IS NULL;

ALTER TABLE public.store_news_posts DROP CONSTRAINT IF EXISTS store_news_posts_visible_content;
ALTER TABLE public.store_news_posts
  ADD CONSTRAINT store_news_posts_visible_content CHECK (
    (image_url IS NOT NULL AND btrim(image_url) <> '')
    OR (title IS NOT NULL AND btrim(title) <> '')
  );

DROP FUNCTION IF EXISTS public.get_store_news_for_shop(character varying, integer);

CREATE OR REPLACE FUNCTION public.get_store_news_for_shop(
  p_store_id character varying,
  p_limit integer DEFAULT 12
)
  RETURNS TABLE (
    id                uuid,
    image_url         text,
    link_product_id   uuid,
    title             character varying,
    body              text,
    sort_order        smallint,
    created_at        timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
  SELECT n.id, n.image_url, n.link_product_id, n.title, n.body, n.sort_order, n.created_at
  FROM public.store_news_posts n
  JOIN public.stores s ON s.id::text = n.store_id::text
  WHERE n.store_id::text = p_store_id::text
    AND n.is_active = true
    AND s.is_active = true
    AND s.status = 'published'::text
    AND (
      (n.image_url IS NOT NULL AND btrim(n.image_url) <> '')
      OR (n.title IS NOT NULL AND btrim(n.title) <> '')
    )
  ORDER BY n.sort_order ASC, n.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 20));
$$;

REVOKE ALL ON FUNCTION public.get_store_news_for_shop(character varying, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_news_for_shop(character varying, integer) TO anon, authenticated;
