CREATE OR REPLACE FUNCTION public.create_owner_store (
  p_id            character varying,
  p_name          character varying,
  p_store_code    character varying,
  p_description   text,
  p_thumbnail_url text
)
  RETURNS character varying
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
  v_code character varying := upper(trim(p_store_code));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF v_code IS NULL OR length(v_code) < 2 OR length(v_code) > 12 THEN
    RAISE EXCEPTION 'invalid_store_code';
  END IF;

  IF v_code !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'invalid_store_code_format';
  END IF;

  INSERT INTO public.stores (id, name, store_code, description, thumbnail_url, owner_id, status, map_config)
  VALUES (
    p_id,
    p_name,
    v_code,
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."create_owner_store"(character varying, character varying, character varying, text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."create_owner_store"(character varying, character varying, character varying, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_owner_store"(character varying, character varying, character varying, text, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."create_owner_store"(character varying, character varying, character varying, text, text) FROM PUBLIC, "anon", "service_role";
