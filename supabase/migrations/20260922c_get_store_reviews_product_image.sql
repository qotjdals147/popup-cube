-- §7.88 P1 — 점주 리뷰 목록: 등록 상품 썸네일 연동 (products.image_url)

DROP FUNCTION IF EXISTS public.get_store_reviews(character varying);

CREATE OR REPLACE FUNCTION public.get_store_reviews(p_store_id character varying)
RETURNS TABLE(
  review_id uuid,
  product_id uuid,
  product_name text,
  product_image_url text,
  order_id uuid,
  order_number integer,
  store_code character varying,
  rating integer,
  body text,
  created_at timestamptz,
  reviewer_nickname character varying,
  image_urls text[],
  owner_reply_body text,
  owner_reply_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    p.id,
    p.name::text,
    p.image_url::text,
    r.order_id,
    o.order_number::integer,
    s.store_code,
    r.rating::integer,
    r.body,
    r.created_at,
    prf.nickname,
    COALESCE(
      (SELECT array_agg(ri.image_url ORDER BY ri.sort_order)
       FROM public.product_review_images ri
       WHERE ri.review_id = r.id),
      ARRAY[]::text[]
    ),
    r.owner_reply_body,
    r.owner_reply_at
  FROM public.product_reviews r
  JOIN public.products p ON p.id = r.product_id
  JOIN public.stores s ON s.id = p.store_id
  JOIN public.orders o ON o.id = r.order_id
  LEFT JOIN public.profiles prf ON prf.id = r.user_id
  WHERE p.store_id = p_store_id
  ORDER BY r.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_store_reviews(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_reviews(character varying) TO authenticated;
