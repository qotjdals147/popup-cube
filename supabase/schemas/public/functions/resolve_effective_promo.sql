CREATE OR REPLACE FUNCTION public.resolve_effective_promo (
  p_product_promo_mode character varying,
  p_product_discount   integer,
  p_store_active       boolean,
  p_store_mode         character varying,
  p_store_discount     integer,
  OUT                  effective_mode character varying,
  OUT                  effective_discount integer
)
  RETURNS record
  LANGUAGE plpgsql
  IMMUTABLE
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_mode character varying;
  v_discount integer := 0;
BEGIN
  IF p_product_promo_mode = 'inherit' THEN
    IF NOT p_store_active THEN
      effective_mode := 'none';
      effective_discount := 0;
      RETURN;
    END IF;
    v_mode := COALESCE(p_store_mode, 'choice');
  ELSE
    v_mode := p_product_promo_mode;
  END IF;

  IF v_mode IN ('discount_only', 'choice') THEN
    v_discount := COALESCE(
      p_product_discount,
      CASE WHEN p_store_active THEN p_store_discount ELSE NULL END,
      0
    );
    v_discount := GREATEST(0, LEAST(100, v_discount));
    IF v_mode = 'discount_only' AND v_discount <= 0 THEN
      effective_mode := 'none';
      effective_discount := 0;
      RETURN;
    END IF;
  END IF;

  effective_mode := v_mode;
  effective_discount := v_discount;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."resolve_effective_promo"(character varying, integer, boolean, character varying, integer) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."resolve_effective_promo"(character varying, integer, boolean, character varying, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."resolve_effective_promo"(character varying, integer, boolean, character varying, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."resolve_effective_promo"(character varying, integer, boolean, character varying, integer) FROM "anon", "authenticated", "service_role";
