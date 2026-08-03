-- Link gacha rolls to orders; owner order list shows prize on same card (ISS-034)

ALTER TABLE public.gacha_rolls
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS gacha_rolls_order_id_idx ON public.gacha_rolls(order_id);

DROP FUNCTION IF EXISTS public.get_store_orders(character varying);

CREATE OR REPLACE FUNCTION public.roll_gacha(
  p_store_id character varying,
  p_order_id uuid DEFAULT NULL
)
RETURNS TABLE(
  entry_id uuid,
  product_id uuid,
  product_name character varying,
  product_image_url text,
  exclusive_name character varying,
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

CREATE OR REPLACE FUNCTION public.get_store_orders(p_store_id character varying)
RETURNS TABLE(
  order_id uuid,
  total_amount integer,
  discount_percent integer,
  reward_type character varying,
  status character varying,
  created_at timestamp with time zone,
  buyer_nickname character varying,
  shipping_label character varying,
  shipping_recipient_name character varying,
  shipping_phone character varying,
  shipping_postal_code character varying,
  shipping_address_line1 character varying,
  shipping_address_line2 character varying,
  item_id uuid,
  product_id uuid,
  product_name character varying,
  quantity integer,
  unit_price integer,
  gacha_product_name character varying,
  gacha_exclusive_name character varying,
  gacha_product_image_url text,
  gacha_exclusive_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.total_amount,
    o.discount_percent,
    o.reward_type,
    o.status,
    o.created_at,
    prf.nickname,
    ua.label,
    ua.recipient_name,
    ua.phone,
    ua.postal_code,
    ua.address_line1,
    ua.address_line2,
    oi.id,
    oi.product_id,
    pr.name,
    oi.quantity,
    oi.unit_price,
    gp.name AS gacha_product_name,
    ge.exclusive_name AS gacha_exclusive_name,
    gp.image_url AS gacha_product_image_url,
    ge.exclusive_image_url AS gacha_exclusive_image_url
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.profiles prf ON prf.id = o.user_id
  LEFT JOIN public.user_addresses ua ON ua.id = o.shipping_address_id
  LEFT JOIN public.gacha_rolls gr ON gr.order_id = o.id
  LEFT JOIN public.gacha_pool_entries ge ON ge.id = gr.pool_entry_id
  LEFT JOIN public.products gp ON gp.id = ge.product_id
  WHERE o.store_id = p_store_id
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;
