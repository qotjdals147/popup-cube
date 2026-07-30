-- Sprint 3 — AD-021: new stores start as draft; owner publishes when ready
-- Reverts auto_publish_owner_created_stores (2026-07-13 demo shortcut)

CREATE OR REPLACE FUNCTION public.create_owner_store(
  p_id text,
  p_name text,
  p_description text,
  p_thumbnail_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.stores (id, name, description, thumbnail_url, owner_id, status, is_active)
  VALUES (p_id, p_name, p_description, p_thumbnail_url, auth.uid(), 'draft', true);

  UPDATE public.profiles
  SET role = 'owner', store_id = p_id
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.create_owner_store(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_owner_store(text, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_owner_store IS
  'Atomically create owner store (draft) and link profile.store_id (Sprint 3, AD-021).';
