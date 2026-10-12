CREATE TABLE "public"."product_review_images" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "review_id"  uuid                     NOT NULL,
  "image_url"  text                     NOT NULL,
  "sort_order" integer                  NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "product_review_images_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_review_images_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public.product_reviews(id) ON DELETE CASCADE
);

ALTER TABLE "public"."product_review_images"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX product_review_images_review_id_idx ON public.product_review_images USING btree (review_id);

CREATE POLICY "product_review_images_public_read" ON "public"."product_review_images"
  FOR SELECT
  TO PUBLIC
  USING (true);

REVOKE ALL ON TABLE "public"."product_review_images" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."product_review_images" TO "anon";

REVOKE ALL ON TABLE "public"."product_review_images" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."product_review_images" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_review_images" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_review_images" TO "postgres";

REVOKE ALL ON TABLE "public"."product_review_images" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."product_review_images" TO "service_role";
