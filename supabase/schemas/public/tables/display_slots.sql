CREATE TABLE "public"."display_slots" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fixture_id" uuid                     NOT NULL,
  "slot_index" integer                  NOT NULL,
  "product_id" uuid,
  "sort_order" integer                  NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "display_slots_fixture_id_fkey" FOREIGN KEY (fixture_id) REFERENCES public.display_fixtures(id) ON DELETE CASCADE,
  CONSTRAINT "display_slots_fixture_id_slot_index_key" UNIQUE (fixture_id, slot_index),
  CONSTRAINT "display_slots_pkey" PRIMARY KEY (id),
  CONSTRAINT "display_slots_slot_index_check" CHECK ((slot_index >= 0)),
  CONSTRAINT "display_slots_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

ALTER TABLE "public"."display_slots"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX display_slots_fixture_id_idx ON public.display_slots USING btree (fixture_id);

CREATE POLICY "display_slots_owner_read" ON "public"."display_slots"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.display_fixtures df
     JOIN public.stores s ON (((s.id)::text = (df.store_id)::text)))
  WHERE ((df.id = display_slots.fixture_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "display_slots_owner_update" ON "public"."display_slots"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.display_fixtures df
     JOIN public.stores s ON (((s.id)::text = (df.store_id)::text)))
  WHERE ((df.id = display_slots.fixture_id) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.display_fixtures df
     JOIN public.stores s ON (((s.id)::text = (df.store_id)::text)))
  WHERE ((df.id = display_slots.fixture_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "display_slots_public_read" ON "public"."display_slots"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.display_fixtures df
     JOIN public.stores s ON (((s.id)::text = (df.store_id)::text)))
  WHERE ((df.id = display_slots.fixture_id) AND (s.is_active = true) AND ((s.status)::text = 'published'::text)))));

REVOKE ALL ON TABLE "public"."display_slots" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."display_slots" TO "anon";

REVOKE ALL ON TABLE "public"."display_slots" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."display_slots" TO "authenticated";

REVOKE ALL ON TABLE "public"."display_slots" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."display_slots" TO "postgres";

REVOKE ALL ON TABLE "public"."display_slots" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."display_slots" TO "service_role";
