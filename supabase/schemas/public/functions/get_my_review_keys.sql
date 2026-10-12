CREATE OR REPLACE FUNCTION public.get_my_review_keys()
  RETURNS TABLE (
    order_id   uuid,
    product_id uuid
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.order_id, r.product_id
  FROM public.product_reviews r
  WHERE r.user_id = auth.uid();
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_my_review_keys"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."get_my_review_keys"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_my_review_keys"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_my_review_keys"() FROM PUBLIC, "anon", "service_role";
