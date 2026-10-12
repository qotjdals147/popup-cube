CREATE OR REPLACE FUNCTION public.get_product_reviews (
  p_product_id uuid
)
  RETURNS TABLE (
    review_id         uuid,
    rating            integer,
    body              text,
    created_at        timestamp with time zone,
    reviewer_nickname character varying,
    image_urls        text[],
    owner_reply_body  text,
    owner_reply_at    timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.rating::integer,
    r.body,
    r.created_at,
    prf.nickname,
    COALESCE(
      (SELECT array_agg(ri.image_url ORDER BY ri.sort_order)
       FROM public.product_review_images ri
       WHERE ri.review_id = r.id),
      ARRAY[]::text[]
    ),
    r.owner_reply_body,
    r.owner_reply_at
  FROM public.product_reviews r
  LEFT JOIN public.profiles prf ON prf.id = r.user_id
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_product_reviews"(uuid) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_product_reviews"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_product_reviews"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_product_reviews"(uuid) FROM "service_role";
