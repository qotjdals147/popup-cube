CREATE TABLE "public"."product_detail_blocks" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_id"   uuid                     NOT NULL,
  "sort_order"   integer                  NOT NULL DEFAULT 0,
  "block_type"   text                     NOT NULL,
  "text_content" text,
  "image_url"    text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_detail_blocks_block_type_check" CHECK ((block_type = ANY (ARRAY['text'::text, 'image'::text]))),
  CONSTRAINT "product_detail_blocks_content_chk" CHECK ((((block_type = 'text'::text) AND (text_content IS NOT NULL)) OR ((block_type = 'image'::text) AND (image_url IS
    NOT NULL)))),
  CONSTRAINT "product_detail_blocks_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_detail_blocks_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

ALTER TABLE "public"."product_detail_blocks"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX product_detail_blocks_product_id_idx ON public.product_detail_blocks USING btree (product_id, sort_order);

CREATE POLICY "product_detail_blocks_owner_delete" ON "public"."product_detail_blocks"
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_blocks.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_blocks_owner_insert" ON "public"."product_detail_blocks"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_blocks.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_blocks_owner_read" ON "public"."product_detail_blocks"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_blocks.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_blocks_owner_update" ON "public"."product_detail_blocks"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_blocks.product_id) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_blocks.product_id) AND (s.owner_id = auth.uid())))));

CREATE POLICY "product_detail_blocks_public_read" ON "public"."product_detail_blocks"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = product_detail_blocks.product_id) AND (p.is_active = true) AND (s.is_active = true) AND ((s.status)::text = 'published'::text)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_detail_blocks" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_detail_blocks" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."product_detail_blocks" TO "anon";

REVOKE ALL ON TABLE "public"."product_detail_blocks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_detail_blocks" TO "postgres";

REVOKE ALL ON TABLE "public"."product_detail_blocks" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."product_detail_blocks" TO "service_role";
