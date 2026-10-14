-- AD-088 L1 · §7.115 — 홈 배ner 슬롯 (완성 소재 · 본사 등록)

CREATE OR REPLACE FUNCTION public.is_platform_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.sponsored_banners (
  id           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  title        character varying(80)    NOT NULL,
  subtitle     character varying(120),
  image_url    text                     NOT NULL,
  store_id     character varying(64),
  product_id   uuid,
  link_url     text,
  sort_order   smallint                 NOT NULL DEFAULT 0,
  starts_at    timestamp with time zone,
  ends_at      timestamp with time zone,
  is_active    boolean                  NOT NULL DEFAULT true,
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  updated_at   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sponsored_banners_pkey PRIMARY KEY (id),
  CONSTRAINT sponsored_banners_title_trim CHECK (char_length(trim(both from title)) > 0),
  CONSTRAINT sponsored_banners_image_trim CHECK (char_length(trim(both from image_url)) > 0),
  CONSTRAINT sponsored_banners_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores (id) ON DELETE SET NULL,
  CONSTRAINT sponsored_banners_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS sponsored_banners_active_idx
  ON public.sponsored_banners (is_active, sort_order, starts_at, ends_at);

COMMENT ON TABLE public.sponsored_banners IS '§7.115 L1 — 손님 홈 슬라이드 (완성 배ner · profiles.role=admin 등록)';

ALTER TABLE public.sponsored_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY sponsored_banners_admin_all ON public.sponsored_banners
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- 손님: 노출 중인 슬롯만
CREATE OR REPLACE FUNCTION public.list_home_sponsored_banners(p_limit integer DEFAULT 10)
  RETURNS TABLE (
    id         uuid,
    title      character varying,
    subtitle   character varying,
    image_url  text,
    store_id   character varying,
    product_id uuid,
    link_url   text,
    sort_order smallint
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO public, pg_temp
AS $$
  SELECT
    b.id,
    b.title,
    b.subtitle,
    b.image_url,
    b.store_id,
    b.product_id,
    b.link_url,
    b.sort_order
  FROM public.sponsored_banners b
  WHERE b.is_active = true
    AND char_length(trim(both from b.image_url)) > 0
    AND (b.starts_at IS NULL OR b.starts_at <= now())
    AND (b.ends_at IS NULL OR b.ends_at >= now())
  ORDER BY b.sort_order ASC, b.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 10), 20));
$$;

REVOKE ALL ON FUNCTION public.list_home_sponsored_banners(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_home_sponsored_banners(integer) TO anon, authenticated;
