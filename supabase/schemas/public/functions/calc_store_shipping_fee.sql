CREATE OR REPLACE FUNCTION public.calc_store_shipping_fee (
  p_fee_type                character varying,
  p_fee_amount              integer,
  p_free_threshold          integer,
  p_subtotal_after_discount integer
)
  RETURNS integer
  LANGUAGE plpgsql
  IMMUTABLE
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  IF p_fee_type = 'free' THEN
    RETURN 0;
  ELSIF p_fee_type = 'flat' THEN
    RETURN GREATEST(0, COALESCE(p_fee_amount, 0));
  ELSIF p_fee_type = 'conditional_free' THEN
    IF COALESCE(p_subtotal_after_discount, 0) >= GREATEST(0, COALESCE(p_free_threshold, 0)) THEN
      RETURN 0;
    END IF;
    RETURN GREATEST(0, COALESCE(p_fee_amount, 0));
  END IF;
  RETURN 0;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."calc_store_shipping_fee"(character varying, integer, integer, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."calc_store_shipping_fee"(character varying, integer, integer, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."calc_store_shipping_fee"(character varying, integer, integer, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."calc_store_shipping_fee"(character varying, integer, integer, integer) FROM PUBLIC, "anon", "service_role";
