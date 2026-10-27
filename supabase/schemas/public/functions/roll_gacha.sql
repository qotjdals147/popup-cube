CREATE OR REPLACE FUNCTION public.roll_gacha (
  p_store_id character varying,
  p_order_id uuid
)
  RETURNS TABLE (
    entry_id            uuid,
    product_id          uuid,
    product_name        character varying,
    product_image_url   text,
    exclusive_name      character varying,
    exclusive_image_url text
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_pool_id uuid;
  v_total_weight integer;
  v_rand numeric;
  v_entry_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND o.store_id = p_store_id
      AND o.user_id = auth.uid()
      AND o.reward_type = 'gacha'
  ) THEN
    RAISE EXCEPTION 'invalid_gacha_order';
  END IF;

  IF EXISTS (SELECT 1 FROM public.gacha_rolls gr WHERE gr.order_id = p_order_id) THEN
    RAISE EXCEPTION 'gacha_already_rolled';
  END IF;

  SELECT gp.id INTO v_pool_id
  FROM public.gacha_pools gp
  WHERE gp.store_id = p_store_id AND gp.linked_product_id IS NULL AND gp.is_active = TRUE
  LIMIT 1;

  IF v_pool_id IS NULL THEN
    RAISE EXCEPTION 'no_active_pool';
  END IF;

  SELECT coalesce(sum(gpe.weight), 0) INTO v_total_weight
  FROM public.gacha_pool_entries gpe
  WHERE gpe.pool_id = v_pool_id AND gpe.is_active = TRUE;

  IF v_total_weight <= 0 THEN
    RAISE EXCEPTION 'empty_pool';
  END IF;

  v_rand := floor(random() * v_total_weight) + 1;

  SELECT gpe.id INTO v_entry_id
  FROM (
    SELECT gpe2.id, sum(gpe2.weight) OVER (ORDER BY gpe2.created_at, gpe2.id) AS running_weight
    FROM public.gacha_pool_entries gpe2
    WHERE gpe2.pool_id = v_pool_id AND gpe2.is_active = TRUE
  ) gpe
  WHERE gpe.running_weight >= v_rand
  ORDER BY gpe.running_weight
  LIMIT 1;

  INSERT INTO public.gacha_rolls (user_id, store_id, pool_entry_id, order_id)
  VALUES (auth.uid(), p_store_id, v_entry_id, p_order_id);

  RETURN QUERY
  SELECT
    e.id,
    e.product_id,
    p.name,
    p.image_url,
    e.exclusive_name,
    e.exclusive_image_url
  FROM public.gacha_pool_entries e
  LEFT JOIN public.products p ON p.id = e.product_id
  WHERE e.id = v_entry_id;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."roll_gacha"(character varying, uuid) FROM PUBLIC, "anon";

GRANT EXECUTE ON FUNCTION "public"."roll_gacha"(character varying, uuid) TO "authenticated";
