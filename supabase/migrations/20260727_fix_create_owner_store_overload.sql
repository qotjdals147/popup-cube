-- Fix duplicate create_owner_store overloads (Sprint 3 regression)
-- PostgREST could not resolve RPC → web "매장을 만들지 못했어요"

DROP FUNCTION IF EXISTS public.create_owner_store(text, text, text, text);
DROP FUNCTION IF EXISTS public.create_owner_store(character varying, character varying, text, text);

CREATE OR REPLACE FUNCTION public.create_owner_store(
  p_id character varying,
  p_name character varying,
  p_description text,
  p_thumbnail_url text
)
RETURNS character varying
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  INSERT INTO public.stores (id, name, description, thumbnail_url, owner_id, status, map_config)
  VALUES (
    p_id,
    p_name,
    p_description,
    p_thumbnail_url,
    auth.uid(),
    'draft',
    jsonb_build_object(
      'storeId', p_id,
      'mapSize', jsonb_build_object('width', 20, 'height', 20),
      'layers', jsonb_build_object('floor', '[]'::jsonb, 'objects', '[]'::jsonb)
    )
  );

  UPDATE public.profiles
  SET role = 'owner', store_id = p_id, updated_at = now()
  WHERE id = auth.uid();

  RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_owner_store(character varying, character varying, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_owner_store(character varying, character varying, text, text) TO authenticated;
