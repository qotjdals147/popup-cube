-- GIF 등 — 원본 파일 + 보이는 영역(%)

ALTER TABLE public.store_news_posts
  ADD COLUMN IF NOT EXISTS image_crop jsonb;

COMMENT ON COLUMN public.store_news_posts.image_crop IS 'react-easy-crop croppedAreaPercentages {x,y,width,height} — GIF framing';

DROP FUNCTION IF EXISTS public.get_store_news_for_shop(character varying, integer);

CREATE OR REPLACE FUNCTION public.get_store_news_for_shop(
  p_store_id character varying,
  p_limit integer DEFAULT 12
)
  RETURNS TABLE (
    id                uuid,
    image_url         text,
    image_crop        jsonb,
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
  SELECT n.id, n.image_url, n.image_crop, n.link_product_id, n.title, n.body, n.sort_order, n.created_at
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
