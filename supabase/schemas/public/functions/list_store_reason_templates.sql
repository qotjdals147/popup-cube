CREATE OR REPLACE FUNCTION public.list_store_reason_templates (
  p_store_id character varying,
  p_kind     character varying
)
  RETURNS TABLE (
    id          uuid,
    reason_code character varying,
    label       text,
    sort_order  integer
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ BEGIN IF p_kind NOT IN ('hold', 'reject') THEN RAISE EXCEPTION 'invalid_kind'; END IF; IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; RETURN QUERY SELECT t.id, t.reason_code, t.label, t.sort_order FROM public.store_order_reason_templates t WHERE t.store_id = p_store_id AND t.template_kind = p_kind AND t.is_active = true ORDER BY t.sort_order, t.created_at; END; $function$;

GRANT EXECUTE ON FUNCTION "public"."list_store_reason_templates"(character varying, character varying) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."list_store_reason_templates"(character varying, character varying) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."list_store_reason_templates"(character varying, character varying) TO "postgres";

REVOKE ALL ON FUNCTION "public"."list_store_reason_templates"(character varying, character varying) FROM PUBLIC, "anon", "service_role";
