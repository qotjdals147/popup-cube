CREATE OR REPLACE FUNCTION public.sync_store_return_address_cache (
  p_store_id character varying
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."sync_store_return_address_cache"(character varying) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."sync_store_return_address_cache"(character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sync_store_return_address_cache"(character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."sync_store_return_address_cache"(character varying) FROM "anon", "authenticated", "service_role";
