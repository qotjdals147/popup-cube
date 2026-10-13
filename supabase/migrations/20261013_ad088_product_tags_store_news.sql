-- AD-088 벤치 08 — 상품 태그 · 매장 새 소식

CREATE TABLE IF NOT EXISTS public.product_tags (
  id          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  store_id    character varying(64)    NOT NULL,
  product_id  uuid                     NOT NULL,
  label       character varying(24)    NOT NULL,
  sort_order  smallint                 NOT NULL DEFAULT 0,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_tags_pkey PRIMARY KEY (id),
  CONSTRAINT product_tags_label_trim CHECK (char_length(trim(both from label)) > 0),
  CONSTRAINT product_tags_unique UNIQUE (product_id, label),
  CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT product_tags_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS product_tags_product_id_idx ON public.product_tags (product_id);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_tags_owner_all ON public.product_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = product_tags.store_id::text
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = product_tags.store_id::text
        AND s.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE public.product_tags IS 'AD-088 — 상품 네임 태그 (product_code와 별개 · 손님 상세 칩)';

CREATE TABLE IF NOT EXISTS public.store_news_posts (
  id          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  store_id    character varying(64)    NOT NULL,
  title       character varying(80)    NOT NULL,
  body        text,
  is_active   boolean                  NOT NULL DEFAULT true,
  sort_order  smallint                 NOT NULL DEFAULT 0,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT store_news_posts_pkey PRIMARY KEY (id),
  CONSTRAINT store_news_posts_title_trim CHECK (char_length(trim(both from title)) > 0),
  CONSTRAINT store_news_posts_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS store_news_posts_store_id_idx ON public.store_news_posts (store_id, sort_order, created_at DESC);

ALTER TABLE public.store_news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY store_news_posts_owner_all ON public.store_news_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = store_news_posts.store_id::text
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = store_news_posts.store_id::text
        AND s.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE public.store_news_posts IS 'AD-088 — 매장 새 소식 (신상·공지 · 상품 상세 노출)';

-- 손님: 태그
CREATE OR REPLACE FUNCTION public.get_product_tags(p_product_id uuid)
  RETURNS TABLE (label character varying, sort_order smallint)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
  SELECT t.label, t.sort_order
  FROM public.product_tags t
  JOIN public.products anchor ON anchor.id = t.product_id
  JOIN public.stores s ON s.id::text = t.store_id::text
  WHERE t.product_id = p_product_id
    AND anchor.is_active = true
    AND s.is_active = true
    AND s.status = 'published'::text
  ORDER BY t.sort_order ASC, t.created_at ASC;
$$;

-- 손님: 매장 소식
CREATE OR REPLACE FUNCTION public.get_store_news_for_shop(
  p_store_id character varying,
  p_limit integer DEFAULT 8
)
  RETURNS TABLE (
    id         uuid,
    title      character varying,
    body       text,
    sort_order smallint,
    created_at timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
  SELECT n.id, n.title, n.body, n.sort_order, n.created_at
  FROM public.store_news_posts n
  JOIN public.stores s ON s.id::text = n.store_id::text
  WHERE n.store_id::text = p_store_id::text
    AND n.is_active = true
    AND s.is_active = true
    AND s.status = 'published'::text
  ORDER BY n.sort_order ASC, n.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 8), 20));
$$;

-- 점주: 태그 목록
CREATE OR REPLACE FUNCTION public.get_owner_product_tags(p_product_id uuid)
  RETURNS TABLE (label character varying, sort_order smallint)
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
  SELECT t.label, t.sort_order
  FROM public.product_tags t
  WHERE t.product_id = p_product_id
  ORDER BY t.sort_order ASC, t.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_owner_product_tags(
  p_product_id uuid,
  p_labels text[]
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
  v_raw text;
  v_label text;
  v_seen text[] := ARRAY[]::text[];
BEGIN
  SELECT p.store_id::text INTO v_store_id
  FROM public.products p
  JOIN public.stores s ON s.id::text = p.store_id::text
  WHERE p.id = p_product_id
    AND s.owner_id = auth.uid();

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'not_owner_or_missing_product';
  END IF;

  DELETE FROM public.product_tags WHERE product_id = p_product_id;

  v_count := COALESCE(array_length(p_labels, 1), 0);
  IF v_count > 12 THEN
    RAISE EXCEPTION 'too_many_product_tags';
  END IF;

  FOR v_i IN 1..v_count LOOP
    v_raw := trim(both from COALESCE(p_labels[v_i], ''));
    IF v_raw = '' THEN
      CONTINUE;
    END IF;
    IF char_length(v_raw) > 24 THEN
      RAISE EXCEPTION 'tag_label_too_long';
    END IF;
    v_label := left(v_raw, 24);
    IF v_label = ANY (v_seen) THEN
      CONTINUE;
    END IF;
    v_seen := array_append(v_seen, v_label);
    INSERT INTO public.product_tags (store_id, product_id, label, sort_order)
    VALUES (v_store_id, p_product_id, v_label, (cardinality(v_seen) - 1)::smallint);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_product_tags(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_tags(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_store_news_for_shop(character varying, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_news_for_shop(character varying, integer) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_owner_product_tags(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_product_tags(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.save_owner_product_tags(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_owner_product_tags(uuid, text[]) TO authenticated;
