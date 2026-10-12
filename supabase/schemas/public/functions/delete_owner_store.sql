CREATE OR REPLACE FUNCTION public.delete_owner_store (
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

  IF EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.status = 'published'
  ) THEN
    RAISE EXCEPTION 'store_still_published';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.store_id = p_store_id
      AND o.status NOT IN ('purchase_confirmed', 'completed', 'rejected', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'store_has_active_orders';
  END IF;

  UPDATE public.profiles
  SET store_id = NULL
  WHERE id = auth.uid() AND store_id = p_store_id;

  DELETE FROM public.stores
  WHERE id = p_store_id AND owner_id = auth.uid();
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."delete_owner_store"(character varying) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."delete_owner_store"(character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."delete_owner_store"(character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."delete_owner_store"(character varying) FROM PUBLIC, "anon", "service_role";
