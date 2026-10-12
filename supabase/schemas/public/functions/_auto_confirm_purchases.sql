CREATE OR REPLACE FUNCTION public._auto_confirm_purchases()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  UPDATE public.orders o
  SET status = 'purchase_confirmed',
      purchase_confirmed_at = now(),
      purchase_confirm_auto = true
  WHERE o.status IN ('shipped', 'delivery_completed')
    AND o.created_at <= now() - interval '7 days'
    AND o.purchase_confirmed_at IS NULL;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."_auto_confirm_purchases"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."_auto_confirm_purchases"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."_auto_confirm_purchases"() FROM PUBLIC, "anon", "authenticated", "service_role";
