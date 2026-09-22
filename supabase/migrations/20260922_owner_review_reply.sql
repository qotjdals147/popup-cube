-- §58 P1 / AD-082 — 점주 리뷰 답글 (owner reply)

ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS owner_reply_body text,
  ADD COLUMN IF NOT EXISTS owner_reply_at timestamptz;

-- 손님 상세 — 답글 포함 (RETURNS 변경 → DROP 후 재생성)
DROP FUNCTION IF EXISTS public.get_product_reviews(uuid);

CREATE OR REPLACE FUNCTION public.get_product_reviews(p_product_id uuid)
RETURNS TABLE(
  review_id uuid,
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
  RETURN QUERY
  SELECT
    r.id,
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
  LEFT JOIN public.profiles prf ON prf.id = r.user_id
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_product_reviews(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_reviews(uuid) TO anon, authenticated;

-- 점주 PC — 매장 전체 리뷰 목록
CREATE OR REPLACE FUNCTION public.get_store_reviews(p_store_id character varying)
RETURNS TABLE(
  review_id uuid,
  product_id uuid,
  product_name text,
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

-- 점주 — 답글 저장 (본인 매장 리뷰만)
CREATE OR REPLACE FUNCTION public.set_owner_review_reply(
  p_review_id uuid,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_body text := nullif(trim(p_body), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF v_body IS NULL THEN
    RAISE EXCEPTION 'empty_reply';
  END IF;

  IF length(v_body) > 2000 THEN
    RAISE EXCEPTION 'reply_too_long';
  END IF;

  UPDATE public.product_reviews r
  SET owner_reply_body = v_body,
      owner_reply_at = now()
  FROM public.products p
  JOIN public.stores s ON s.id = p.store_id
  WHERE r.id = p_review_id
    AND r.product_id = p.id
    AND s.owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_owner_review_reply(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_owner_review_reply(uuid, text) TO authenticated;
