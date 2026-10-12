CREATE OR REPLACE FUNCTION public.upsert_store_reason_template (
  p_store_id    character varying,
  p_kind        character varying,
  p_reason_code character varying,
  p_label       text,
  p_template_id uuid              DEFAULT NULL::uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$ DECLARE v_id uuid; v_label text := trim(p_label); BEGIN IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid()) THEN RAISE EXCEPTION 'not_store_owner'; END IF; IF v_label IS NULL OR length(v_label) = 0 THEN RAISE EXCEPTION 'empty_label'; END IF; IF p_template_id IS NULL THEN INSERT INTO public.store_order_reason_templates (store_id, template_kind, reason_code, label) VALUES (p_store_id, p_kind, p_reason_code, v_label) RETURNING id INTO v_id; ELSE UPDATE public.store_order_reason_templates t SET label = v_label, reason_code = p_reason_code, updated_at = now() WHERE t.id = p_template_id AND t.store_id = p_store_id RETURNING t.id INTO v_id; END IF; RETURN v_id; END; $function$;

GRANT EXECUTE ON FUNCTION "public"."upsert_store_reason_template"(character varying, character varying, character varying, text, uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."upsert_store_reason_template"(character varying, character varying, character varying, text, uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."upsert_store_reason_template"(character varying, character varying, character varying, text, uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."upsert_store_reason_template"(character varying, character varying, character varying, text, uuid) FROM PUBLIC, "anon", "service_role";
