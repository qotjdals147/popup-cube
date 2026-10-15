-- AD-088 §7.113 — 앱 홈 피드 태그 필터

CREATE OR REPLACE FUNCTION public.get_home_product_tags_for_feed()
  RETURNS TABLE (product_id uuid, label character varying)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
  SELECT t.product_id, t.label
  FROM public.product_tags t
  JOIN public.products p ON p.id = t.product_id
  JOIN public.stores s ON s.id::text = t.store_id::text
  WHERE p.is_active = true
    AND s.is_active = true
    AND s.status = 'published'::text
  ORDER BY t.label ASC, t.product_id ASC;
$$;

REVOKE ALL ON FUNCTION public.get_home_product_tags_for_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_product_tags_for_feed() TO anon, authenticated;
