CREATE OR REPLACE FUNCTION public.seed_display_slots_for_fixture()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
  v_slot_count INTEGER;
  i INTEGER;
BEGIN
  SELECT ft.slot_count INTO v_slot_count
  FROM public.fixture_templates ft
  WHERE ft.id = NEW.template_id;

  IF v_slot_count IS NULL THEN
    RAISE EXCEPTION 'Unknown fixture template: %', NEW.template_id;
  END IF;

  FOR i IN 0 .. (v_slot_count - 1) LOOP
    INSERT INTO public.display_slots (fixture_id, slot_index, sort_order)
    VALUES (NEW.id, i, i);
  END LOOP;

  RETURN NEW;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."seed_display_slots_for_fixture"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."seed_display_slots_for_fixture"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."seed_display_slots_for_fixture"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."seed_display_slots_for_fixture"() FROM "anon", "authenticated", "service_role";
