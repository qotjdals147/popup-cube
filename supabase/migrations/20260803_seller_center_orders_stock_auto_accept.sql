-- AD-052 / AD-053: stock, order workflow, auto-accept quota, owner RPCs

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 999999,
  ADD COLUMN IF NOT EXISTS auto_accept_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_accept_limit integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_accept_remaining integer NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS auto_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_number character varying,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending', 'paid', 'awaiting_accept', 'accepted', 'rejected',
    'shipped', 'completed', 'cancelled'
  )
);

-- Legacy mock orders went straight to paid → treat as already accepted for 발주·배송 tab
UPDATE public.orders SET status = 'accepted', accepted_at = COALESCE(accepted_at, created_at)
WHERE status = 'paid';

CREATE OR REPLACE FUNCTION public._restore_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity + r.quantity,
        updated_at = now()
    WHERE p.id = r.product_id;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public._restore_auto_accept_quota(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT oi.product_id
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    UPDATE public.products p
    SET auto_accept_remaining = LEAST(
          p.auto_accept_limit,
          p.auto_accept_remaining + 1
        ),
        updated_at = now()
    WHERE p.id = r.product_id
      AND p.auto_accept_enabled = true
      AND p.auto_accept_limit > 0;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.place_order(
  p_store_id character varying,
  p_address_id uuid,
  p_items jsonb,
  p_reward_type character varying,
  p_discount_percent integer
)
RETURNS TABLE(order_id uuid, total_amount integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_product_price integer;
  v_quantity integer;
  v_subtotal integer := 0;
  v_final_total integer;
  v_item_count integer := 0;
  v_can_auto boolean := true;
  v_status character varying;
  v_stock integer;
  v_auto_on boolean;
  v_auto_rem integer;
  v_seen_products uuid[] := ARRAY[]::uuid[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_reward_type NOT IN ('discount', 'gacha') THEN
    RAISE EXCEPTION 'invalid_reward_type';
  END IF;

  IF p_address_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_addresses WHERE id = p_address_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'invalid_address';
    END IF;
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  -- Pass 1: validate products, stock, auto-accept eligibility
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.id, p.price, p.stock_quantity, p.auto_accept_enabled, p.auto_accept_remaining
    INTO v_product_id, v_product_price, v_stock, v_auto_on, v_auto_rem
    FROM public.products p
    WHERE p.id = (v_item->>'product_id')::uuid
      AND p.store_id = p_store_id
      AND p.is_active = true;

    IF v_product_id IS NULL THEN
      CONTINUE;
    END IF;

    v_quantity := GREATEST(1, (v_item->>'quantity')::integer);

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    v_item_count := v_item_count + 1;

    IF NOT (v_auto_on AND v_auto_rem > 0) THEN
      v_can_auto := false;
    END IF;
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  IF p_reward_type = 'discount' THEN
    IF p_discount_percent IS NULL OR p_discount_percent <= 0 OR p_discount_percent > 100 THEN
      RAISE EXCEPTION 'invalid_discount';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.store_promotions
      WHERE store_id = p_store_id AND is_active = true AND discount_percent = p_discount_percent
    ) THEN
      RAISE EXCEPTION 'discount_mismatch';
    END IF;
  END IF;

  v_order_id := gen_random_uuid();

  IF v_can_auto THEN
    v_status := 'accepted';
  ELSE
    v_status := 'awaiting_accept';
  END IF;

  INSERT INTO public.orders (
    id, store_id, user_id, shipping_address_id, total_amount, discount_percent,
    reward_type, status, auto_accepted, accepted_at
  )
  VALUES (
    v_order_id, p_store_id, v_user_id, p_address_id, 0,
    CASE WHEN p_reward_type = 'discount' THEN p_discount_percent ELSE NULL END,
    p_reward_type, v_status, v_can_auto,
    CASE WHEN v_can_auto THEN now() ELSE NULL END
  );

  v_subtotal := 0;
  v_item_count := 0;
  v_seen_products := ARRAY[]::uuid[];

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.id, p.price, p.stock_quantity
    INTO v_product_id, v_product_price, v_stock
    FROM public.products p
    WHERE p.id = (v_item->>'product_id')::uuid
      AND p.store_id = p_store_id
      AND p.is_active = true;

    IF v_product_id IS NULL THEN
      CONTINUE;
    END IF;

    v_quantity := GREATEST(1, (v_item->>'quantity')::integer);

    UPDATE public.products p
    SET stock_quantity = p.stock_quantity - v_quantity,
        updated_at = now()
    WHERE p.id = v_product_id
      AND p.stock_quantity >= v_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    v_subtotal := v_subtotal + (v_product_price * v_quantity);
    v_item_count := v_item_count + 1;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, v_product_id, v_quantity, v_product_price);

    IF v_can_auto AND NOT (v_product_id = ANY (v_seen_products)) THEN
      UPDATE public.products p
      SET auto_accept_remaining = p.auto_accept_remaining - 1,
          updated_at = now()
      WHERE p.id = v_product_id
        AND p.auto_accept_enabled = true
        AND p.auto_accept_remaining > 0;

      v_seen_products := array_append(v_seen_products, v_product_id);
    END IF;
  END LOOP;

  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'no_valid_items';
  END IF;

  IF p_reward_type = 'discount' THEN
    v_final_total := round(v_subtotal * (100 - p_discount_percent) / 100.0);
  ELSE
    v_final_total := v_subtotal;
  END IF;

  UPDATE public.orders SET total_amount = v_final_total WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_final_total;
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
BEGIN
  SELECT o.store_id INTO v_store_id
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  UPDATE public.orders o
  SET status = 'accepted', accepted_at = now()
  WHERE o.id = p_order_id AND o.status = 'awaiting_accept';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_status character varying;
  v_auto boolean;
BEGIN
  SELECT o.store_id, o.status, o.auto_accepted
  INTO v_store_id, v_status, v_auto
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF v_status NOT IN ('awaiting_accept', 'accepted') THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;

  IF v_status = 'accepted' AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.shipped_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'already_shipped';
  END IF;

  PERFORM public._restore_order_stock(p_order_id);

  IF v_auto THEN
    PERFORM public._restore_auto_accept_quota(p_order_id);
  END IF;

  UPDATE public.orders o
  SET status = 'rejected'
  WHERE o.id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ship_order(p_order_id uuid, p_tracking_number character varying DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
BEGIN
  SELECT o.store_id INTO v_store_id FROM public.orders o WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  UPDATE public.orders o
  SET status = 'shipped', tracking_number = p_tracking_number, shipped_at = now()
  WHERE o.id = p_order_id AND o.status = 'accepted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_order_state';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_fulfillment(
  p_product_id uuid,
  p_stock_quantity integer,
  p_auto_accept_enabled boolean,
  p_auto_accept_limit integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_store_id character varying;
  v_old_limit integer;
  v_old_rem integer;
  v_new_rem integer;
BEGIN
  SELECT p.store_id, p.auto_accept_limit, p.auto_accept_remaining
  INTO v_store_id, v_old_limit, v_old_rem
  FROM public.products p
  WHERE p.id = p_product_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_store_owner';
  END IF;

  IF p_stock_quantity < 0 OR p_auto_accept_limit < 0 THEN
    RAISE EXCEPTION 'invalid_values';
  END IF;

  IF p_auto_accept_enabled AND p_auto_accept_limit <= 0 THEN
    RAISE EXCEPTION 'auto_accept_limit_required';
  END IF;

  IF NOT p_auto_accept_enabled THEN
    v_new_rem := 0;
  ELSIF p_auto_accept_limit > v_old_limit THEN
    v_new_rem := v_old_rem + (p_auto_accept_limit - v_old_limit);
  ELSIF p_auto_accept_limit < v_old_limit THEN
    v_new_rem := LEAST(v_old_rem, p_auto_accept_limit);
  ELSE
    v_new_rem := v_old_rem;
  END IF;

  IF p_auto_accept_enabled AND v_new_rem <= 0 THEN
    v_new_rem := p_auto_accept_limit;
  END IF;

  UPDATE public.products p
  SET
    stock_quantity = p_stock_quantity,
    auto_accept_enabled = p_auto_accept_enabled,
    auto_accept_limit = CASE WHEN p_auto_accept_enabled THEN p_auto_accept_limit ELSE 0 END,
    auto_accept_remaining = CASE WHEN p_auto_accept_enabled THEN v_new_rem ELSE 0 END,
    updated_at = now()
  WHERE p.id = p_product_id;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_store_orders(character varying);

CREATE OR REPLACE FUNCTION public.get_store_orders(p_store_id character varying)
RETURNS TABLE(
  order_id uuid,
  total_amount integer,
  discount_percent integer,
  reward_type character varying,
  status character varying,
  auto_accepted boolean,
  accepted_at timestamp with time zone,
  tracking_number character varying,
  shipped_at timestamp with time zone,
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
    o.auto_accepted,
    o.accepted_at,
    o.tracking_number,
    o.shipped_at,
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
    AND o.status NOT IN ('rejected', 'cancelled')
  ORDER BY o.created_at DESC, oi.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ship_order(uuid, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_product_fulfillment(uuid, integer, boolean, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ship_order(uuid, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_fulfillment(uuid, integer, boolean, integer) TO authenticated;
