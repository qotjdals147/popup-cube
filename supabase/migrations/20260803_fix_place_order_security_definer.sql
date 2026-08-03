-- ISS: place_order stock deduct UPDATE products — shoppers lack products UPDATE RLS.
-- Without SECURITY DEFINER, order save fails (often surfaced as insufficient_stock / generic orderSaveError).

ALTER FUNCTION public.place_order(
  character varying,
  uuid,
  jsonb,
  character varying,
  integer
)
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp';
