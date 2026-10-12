CREATE OR REPLACE FUNCTION public._restore_auto_accept_quota (
  p_order_id uuid
)
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

GRANT EXECUTE ON FUNCTION "public"."_restore_auto_accept_quota"(uuid) TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."_restore_auto_accept_quota"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."_restore_auto_accept_quota"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."_restore_auto_accept_quota"(uuid) FROM "anon", "authenticated", "service_role";
