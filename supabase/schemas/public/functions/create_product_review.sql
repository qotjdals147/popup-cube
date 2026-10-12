CREATE OR REPLACE FUNCTION public.create_product_review (
  p_order_id   uuid,
  p_product_id uuid,
  p_rating     integer,
  p_body       text,
  p_image_urls text[]
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_order_status character varying;
  v_review_id uuid;
  v_url text;
  v_idx integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'invalid_rating';
  END IF;

  IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
    RAISE EXCEPTION 'empty_body';
  END IF;

  SELECT o.status INTO v_order_status
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.id = p_order_id AND o.user_id = v_user_id AND oi.product_id = p_product_id
  LIMIT 1;

  IF v_order_status IS NULL THEN
    RAISE EXCEPTION 'order_item_not_found';
  END IF;

  IF v_order_status NOT IN ('purchase_confirmed', 'completed') THEN
    RAISE EXCEPTION 'purchase_not_confirmed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.product_reviews
    WHERE order_id = p_order_id AND product_id = p_product_id
  ) THEN
    RAISE EXCEPTION 'already_reviewed';
  END IF;

  INSERT INTO public.product_reviews (product_id, order_id, user_id, rating, body)
  VALUES (p_product_id, p_order_id, v_user_id, p_rating, trim(p_body))
  RETURNING id INTO v_review_id;

  IF p_image_urls IS NOT NULL THEN
    FOREACH v_url IN ARRAY p_image_urls[1:5]
    LOOP
      IF v_url IS NOT NULL AND length(trim(v_url)) > 0 THEN
        INSERT INTO public.product_review_images (review_id, image_url, sort_order)
        VALUES (v_review_id, v_url, v_idx);
        v_idx := v_idx + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN v_review_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."create_product_review"(uuid, uuid, integer, text, text[]) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."create_product_review"(uuid, uuid, integer, text, text[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."create_product_review"(uuid, uuid, integer, text, text[]) TO "postgres";

REVOKE ALL ON FUNCTION "public"."create_product_review"(uuid, uuid, integer, text, text[]) FROM PUBLIC, "anon", "service_role";
