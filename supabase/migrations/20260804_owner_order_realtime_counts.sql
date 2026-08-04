-- AD-055: owner order counts RPC + Realtime on orders (sidebar badges / toast)

CREATE OR REPLACE FUNCTION public.get_store_order_counts(p_store_id character varying)
RETURNS TABLE(
  pending_accept integer,
  awaiting_ship integer
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
    COUNT(*) FILTER (
      WHERE o.status IN ('awaiting_accept', 'pending', 'paid')
    )::integer AS pending_accept,
    COUNT(*) FILTER (
      WHERE o.status = 'accepted'
    )::integer AS awaiting_ship
  FROM public.orders o
  WHERE o.store_id = p_store_id
    AND o.status NOT IN ('rejected', 'cancelled');
END;
$function$;

REVOKE ALL ON FUNCTION public.get_store_order_counts(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_order_counts(character varying) TO authenticated;

-- Realtime: owners receive INSERT/UPDATE via RLS (orders_select_store_owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
