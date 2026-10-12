CREATE OR REPLACE FUNCTION public.unpublish_store (
  p_store_id character varying
)
  RETURNS void
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
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  UPDATE public.stores
  SET status = 'draft'
  WHERE id = p_store_id AND owner_id = auth.uid();
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."unpublish_store"(character varying) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."unpublish_store"(character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."unpublish_store"(character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."unpublish_store"(character varying) FROM PUBLIC, "anon", "service_role";
