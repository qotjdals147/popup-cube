CREATE TABLE "public"."product_detail_images" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid                     NOT NULL,
  "image_url"  text                     NOT NULL,
  "sort_order" integer                  NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_detail_images_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_detail_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

ALTER TABLE "public"."product_detail_images"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX product_detail_images_product_id_idx ON public.product_detail_images USING btree (product_id);

CREATE POLICY "product_detail_images_owner_delete" ON "public"."product_detail_images"
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_images.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_images_owner_insert" ON "public"."product_detail_images"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_images.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_images_owner_read" ON "public"."product_detail_images"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_images.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_images_owner_update" ON "public"."product_detail_images"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_images.product_id) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_images.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_images_public_read" ON "public"."product_detail_images"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_images.product_id) AND (p.is_active = true) AND (s.is_active = true) AND ((s.status)::text = 'published'::text)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_detail_images" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_detail_images" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."product_detail_images" TO "anon";

REVOKE ALL ON TABLE "public"."product_detail_images" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_detail_images" TO "postgres";

REVOKE ALL ON TABLE "public"."product_detail_images" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."product_detail_images" TO "service_role";
