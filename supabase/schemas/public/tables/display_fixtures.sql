CREATE TABLE "public"."display_fixtures" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "store_id"    character varying(64)    NOT NULL,
  "template_id" text                     NOT NULL,
  "origin_x"    integer                  NOT NULL,
  "origin_y"    integer                  NOT NULL,
  "rotation"    integer                  NOT NULL DEFAULT 0,
  "label"       text,
  "sort_order"  integer                  NOT NULL DEFAULT 0,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "display_fixtures_origin_x_check" CHECK ((origin_x >= 0)),
  CONSTRAINT "display_fixtures_origin_y_check" CHECK ((origin_y >= 0)),
  CONSTRAINT "display_fixtures_pkey" PRIMARY KEY (id),
  CONSTRAINT "display_fixtures_rotation_check" CHECK ((rotation = ANY (ARRAY[0, 90, 180, 270]))),
  CONSTRAINT "display_fixtures_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.fixture_templates(id),
  CONSTRAINT "display_fixtures_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."display_fixtures"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX display_fixtures_store_id_idx ON public.display_fixtures USING btree (store_id);

CREATE TRIGGER trg_display_fixtures_updated_at
  BEFORE UPDATE ON public.display_fixtures
  FOR EACH ROW
  EXECUTE FUNCTION public.set_display_fixture_updated_at();

CREATE TRIGGER trg_seed_display_slots
  AFTER INSERT ON public.display_fixtures
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_display_slots_for_fixture();

CREATE POLICY "display_fixtures_owner_delete" ON "public"."display_fixtures"
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (display_fixtures.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "display_fixtures_owner_insert" ON "public"."display_fixtures"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (display_fixtures.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "display_fixtures_owner_read" ON "public"."display_fixtures"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (display_fixtures.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "display_fixtures_owner_update" ON "public"."display_fixtures"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (display_fixtures.store_id)::text) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (display_fixtures.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "display_fixtures_public_read" ON "public"."display_fixtures"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (display_fixtures.store_id)::text) AND (s.is_active = true) AND ((s.status)::text = 'published'::text)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."display_fixtures" TO "authenticated";

REVOKE ALL ON TABLE "public"."display_fixtures" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."display_fixtures" TO "anon";

REVOKE ALL ON TABLE "public"."display_fixtures" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."display_fixtures" TO "postgres";

REVOKE ALL ON TABLE "public"."display_fixtures" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."display_fixtures" TO "service_role";
