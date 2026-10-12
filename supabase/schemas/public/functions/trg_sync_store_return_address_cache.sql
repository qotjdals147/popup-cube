CREATE OR REPLACE FUNCTION public.trg_sync_store_return_address_cache()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."trg_sync_store_return_address_cache"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."trg_sync_store_return_address_cache"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."trg_sync_store_return_address_cache"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."trg_sync_store_return_address_cache"() FROM "anon", "authenticated", "service_role";
