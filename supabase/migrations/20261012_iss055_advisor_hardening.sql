-- ISS-055 — Supabase security advisor (search_path · RLS RPC-only 명시)

CREATE OR REPLACE FUNCTION public.resolve_effective_promo(
  p_product_promo_mode character varying,
  p_product_discount integer,
  p_store_active boolean,
  p_store_mode character varying,
  p_store_discount integer,
  OUT effective_mode character varying,
  OUT effective_discount integer
)
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

CREATE OR REPLACE FUNCTION public.set_display_fixture_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- REST 직접 접근 차단 — 앱은 SECURITY DEFINER RPC만 사용 (deny-all과 동일 · advisor 0008)
DROP POLICY IF EXISTS order_returns_no_direct_api ON public.order_returns;
CREATE POLICY order_returns_no_direct_api ON public.order_returns
  FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS order_claim_messages_no_direct_api ON public.order_claim_messages;
CREATE POLICY order_claim_messages_no_direct_api ON public.order_claim_messages
  FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS order_place_idempotency_no_direct_api ON public.order_place_idempotency;
CREATE POLICY order_place_idempotency_no_direct_api ON public.order_place_idempotency
  FOR ALL
  USING (false)
  WITH CHECK (false);
