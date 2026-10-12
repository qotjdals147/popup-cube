CREATE OR REPLACE FUNCTION public.set_owner_review_reply (
  p_review_id uuid,
  p_body      text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_body text := nullif(trim(p_body), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF v_body IS NULL THEN
    RAISE EXCEPTION 'empty_reply';
  END IF;

  IF length(v_body) > 2000 THEN
    RAISE EXCEPTION 'reply_too_long';
  END IF;

  UPDATE public.product_reviews r
  SET owner_reply_body = v_body,
      owner_reply_at = now()
  FROM public.products p
  JOIN public.stores s ON s.id = p.store_id
  WHERE r.id = p_review_id
    AND r.product_id = p.id
    AND s.owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."set_owner_review_reply"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."set_owner_review_reply"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_owner_review_reply"(uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."set_owner_review_reply"(uuid, text) FROM PUBLIC, "anon", "service_role";
