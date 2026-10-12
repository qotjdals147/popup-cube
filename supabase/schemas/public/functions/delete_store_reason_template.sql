CREATE OR REPLACE FUNCTION public.delete_store_reason_template (
  p_template_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
BEGIN
  IF p_template_id IS NULL THEN
    RAISE EXCEPTION 'missing_template_id';
  END IF;

  DELETE FROM public.store_order_reason_templates t
  WHERE t.id = p_template_id
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = t.store_id AND s.owner_id = auth.uid()
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'template_not_found';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."delete_store_reason_template"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."delete_store_reason_template"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."delete_store_reason_template"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."delete_store_reason_template"(uuid) FROM PUBLIC, "anon", "service_role";
