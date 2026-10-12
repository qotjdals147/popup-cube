CREATE OR REPLACE FUNCTION public.roll_gacha (
  p_store_id character varying
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
  SET search_path TO 'public'
  AS $function$
declare
  v_pool_id uuid;
  v_total_weight integer;
  v_rand numeric;
  v_entry_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select gp.id into v_pool_id
  from gacha_pools gp
  where gp.store_id = p_store_id and gp.linked_product_id is null and gp.is_active = true
  limit 1;

  if v_pool_id is null then
    raise exception 'no_active_pool';
  end if;

  select coalesce(sum(gpe.weight), 0) into v_total_weight
  from gacha_pool_entries gpe
  where gpe.pool_id = v_pool_id and gpe.is_active = true;

  if v_total_weight <= 0 then
    raise exception 'empty_pool';
  end if;

  v_rand := floor(random() * v_total_weight) + 1;

  select gpe.id into v_entry_id
  from (
    select gpe2.id, sum(gpe2.weight) over (order by gpe2.created_at, gpe2.id) as running_weight
    from gacha_pool_entries gpe2
    where gpe2.pool_id = v_pool_id and gpe2.is_active = true
  ) gpe
  where gpe.running_weight >= v_rand
  order by gpe.running_weight
  limit 1;

  insert into gacha_rolls (user_id, store_id, pool_entry_id)
  values (auth.uid(), p_store_id, v_entry_id);

  return query
  select
    e.id,
    e.product_id,
    p.name,
    p.image_url,
    e.exclusive_name,
    e.exclusive_image_url
  from gacha_pool_entries e
  left join products p on p.id = e.product_id
  where e.id = v_entry_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.roll_gacha (
  p_store_id character varying,
  p_order_id uuid              DEFAULT NULL::uuid
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

  IF p_order_id IS NOT NULL THEN
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

GRANT EXECUTE ON FUNCTION "public"."roll_gacha"(character varying) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."roll_gacha"(character varying, uuid) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."roll_gacha"(character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."roll_gacha"(character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."roll_gacha"(character varying, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."roll_gacha"(character varying, uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."roll_gacha"(character varying, uuid) FROM "anon", "authenticated", "service_role";

REVOKE ALL ON FUNCTION "public"."roll_gacha"(character varying) FROM PUBLIC, "anon", "service_role";
