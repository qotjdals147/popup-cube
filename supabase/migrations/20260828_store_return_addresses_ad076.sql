-- AD-076 — 점주 반품·교환 수령지 CRUD (store_return_addresses)

CREATE TABLE IF NOT EXISTS public.store_return_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id character varying NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  label character varying(40) NOT NULL,
  recipient_name character varying(60) NOT NULL,
  phone character varying(20) NOT NULL,
  postal_code character varying(10) NOT NULL,
  address_line1 character varying(200) NOT NULL,
  address_line2 character varying(200),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_return_addresses_store_id_idx
  ON public.store_return_addresses (store_id);

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS default_return_address_id uuid
  REFERENCES public.store_return_addresses(id) ON DELETE SET NULL;

-- 기존 stores.return_* → 첫 row backfill
INSERT INTO public.store_return_addresses (
  store_id, label, recipient_name, phone, postal_code, address_line1, address_line2, is_default
)
SELECT
  s.id,
  '기본 반품지',
  COALESCE(NULLIF(trim(s.return_recipient_name), ''), '수령인'),
  COALESCE(NULLIF(trim(s.return_phone), ''), '-'),
  COALESCE(NULLIF(trim(s.return_postal_code), ''), '-'),
  COALESCE(NULLIF(trim(s.return_address_line1), ''), '-'),
  NULLIF(trim(s.return_address_line2), ''),
  true
FROM public.stores s
WHERE (
  NULLIF(trim(s.return_postal_code), '') IS NOT NULL
  OR NULLIF(trim(s.return_address_line1), '') IS NOT NULL
  OR NULLIF(trim(s.return_recipient_name), '') IS NOT NULL
)
AND NOT EXISTS (
  SELECT 1 FROM public.store_return_addresses sra WHERE sra.store_id = s.id
);

UPDATE public.stores s
SET default_return_address_id = sra.id
FROM public.store_return_addresses sra
WHERE sra.store_id = s.id
  AND sra.is_default = true
  AND s.default_return_address_id IS NULL;

CREATE OR REPLACE FUNCTION public.sync_store_return_address_cache(p_store_id character varying)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.store_return_addresses%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.store_return_addresses
  WHERE store_id = p_store_id AND is_default = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.stores
    SET
      default_return_address_id = v_row.id,
      return_recipient_name = v_row.recipient_name,
      return_phone = v_row.phone,
      return_postal_code = v_row.postal_code,
      return_address_line1 = v_row.address_line1,
      return_address_line2 = v_row.address_line2
    WHERE id = p_store_id;
  ELSE
    UPDATE public.stores
    SET
      default_return_address_id = NULL,
      return_recipient_name = NULL,
      return_phone = NULL,
      return_postal_code = NULL,
      return_address_line1 = NULL,
      return_address_line2 = NULL
    WHERE id = p_store_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_store_return_address_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id character varying;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
  ELSE
    v_store_id := NEW.store_id;
  END IF;

  PERFORM public.sync_store_return_address_cache(v_store_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS store_return_addresses_sync_cache ON public.store_return_addresses;
CREATE TRIGGER store_return_addresses_sync_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.store_return_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_store_return_address_cache();

ALTER TABLE public.store_return_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY store_return_addresses_select_owner
  ON public.store_return_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_return_addresses.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY store_return_addresses_insert_owner
  ON public.store_return_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_return_addresses.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY store_return_addresses_update_owner
  ON public.store_return_addresses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_return_addresses.store_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_return_addresses.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY store_return_addresses_delete_owner
  ON public.store_return_addresses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_return_addresses.store_id AND s.owner_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_return_addresses TO authenticated;
