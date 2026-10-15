-- AD-088 2차 — 손님 매장 태그 필터

CREATE INDEX IF NOT EXISTS product_tags_store_id_label_idx
  ON public.product_tags (store_id, label);

CREATE OR REPLACE FUNCTION public.get_store_product_tags_for_shop(p_store_id character varying)
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
  WHERE t.store_id::text = p_store_id::text
    AND p.is_active = true
    AND s.is_active = true
    AND s.status = 'published'::text
  ORDER BY t.label ASC, t.product_id ASC;
$$;

REVOKE ALL ON FUNCTION public.get_store_product_tags_for_shop(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_product_tags_for_shop(character varying) TO anon, authenticated;
