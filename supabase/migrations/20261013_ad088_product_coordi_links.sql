-- AD-088 — 점주 지정 코디 상품 (A → B/C 링크)

CREATE TABLE IF NOT EXISTS public.product_coordi_links (
  id                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  store_id          character varying(64)    NOT NULL,
  product_id        uuid                     NOT NULL,
  linked_product_id uuid                     NOT NULL,
  sort_order        smallint                 NOT NULL DEFAULT 0,
  created_at        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_coordi_links_pkey PRIMARY KEY (id),
  CONSTRAINT product_coordi_links_distinct CHECK (product_id <> linked_product_id),
  CONSTRAINT product_coordi_links_unique UNIQUE (product_id, linked_product_id),
  CONSTRAINT product_coordi_links_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT product_coordi_links_linked_product_id_fkey FOREIGN KEY (linked_product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT product_coordi_links_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS product_coordi_links_product_id_idx ON public.product_coordi_links (product_id);

ALTER TABLE public.product_coordi_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_coordi_links_owner_all ON public.product_coordi_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = product_coordi_links.store_id::text
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = product_coordi_links.store_id::text
        AND s.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE public.product_coordi_links IS 'AD-088 — 기준 상품(product_id)에 함께 노출할 코디 상품(linked_product_id)';

-- 손님: 활성·공개 매장 상품만
CREATE OR REPLACE FUNCTION public.get_product_coordi_products(p_product_id uuid)
  RETURNS TABLE (
    id         uuid,
    name       character varying,
    price      integer,
    image_url  text,
    sort_order smallint
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    l.sort_order
  FROM public.product_coordi_links l
  JOIN public.products anchor ON anchor.id = l.product_id
  JOIN public.products p ON p.id = l.linked_product_id
  JOIN public.stores s ON s.id::text = l.store_id::text
  WHERE l.product_id = p_product_id
    AND anchor.is_active = true
    AND p.is_active = true
    AND s.is_active = true
    AND s.status = 'published'::text
  ORDER BY l.sort_order ASC, l.created_at ASC;
$$;

-- 점주: 링크 ID 목록
CREATE OR REPLACE FUNCTION public.get_owner_product_coordi_links(p_product_id uuid)
  RETURNS TABLE (linked_product_id uuid, sort_order smallint)
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.stores s ON s.id::text = p.store_id::text
    WHERE p.id = p_product_id
      AND s.owner_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT l.linked_product_id, l.sort_order
  FROM public.product_coordi_links l
  WHERE l.product_id = p_product_id
  ORDER BY l.sort_order ASC, l.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_owner_product_coordi_links(
  p_product_id uuid,
  p_linked_ids uuid[]
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
DECLARE
  v_store_id text;
  v_count int;
  v_i int;
  v_lid uuid;
BEGIN
  SELECT p.store_id::text INTO v_store_id
  FROM public.products p
  JOIN public.stores s ON s.id::text = p.store_id::text
  WHERE p.id = p_product_id
    AND s.owner_id = auth.uid();

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'not_owner_or_missing_product';
  END IF;

  v_count := COALESCE(array_length(p_linked_ids, 1), 0);
  IF v_count > 12 THEN
    RAISE EXCEPTION 'too_many_coordi_links';
  END IF;

  FOR v_i IN 1..v_count LOOP
    v_lid := p_linked_ids[v_i];
    IF v_lid = p_product_id THEN
      RAISE EXCEPTION 'self_link_not_allowed';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = v_lid AND p.store_id::text = v_store_id
    ) THEN
      RAISE EXCEPTION 'linked_product_wrong_store';
    END IF;
  END LOOP;

  DELETE FROM public.product_coordi_links WHERE product_id = p_product_id;

  FOR v_i IN 1..v_count LOOP
    v_lid := p_linked_ids[v_i];
    INSERT INTO public.product_coordi_links (store_id, product_id, linked_product_id, sort_order)
    VALUES (v_store_id, p_product_id, v_lid, (v_i - 1)::smallint)
    ON CONFLICT (product_id, linked_product_id) DO UPDATE
      SET sort_order = EXCLUDED.sort_order;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_product_coordi_products(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_coordi_products(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_owner_product_coordi_links(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_product_coordi_links(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.save_owner_product_coordi_links(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_owner_product_coordi_links(uuid, uuid[]) TO authenticated;
