CREATE TABLE "public"."product_reviews" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_id"       uuid                     NOT NULL,
  "order_id"         uuid                     NOT NULL,
  "user_id"          uuid                     NOT NULL,
  "rating"           smallint                 NOT NULL,
  "body"             text                     NOT NULL,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "owner_reply_body" text,
  "owner_reply_at"   timestamp with time zone,
  CONSTRAINT "product_reviews_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT "product_reviews_order_id_product_id_key" UNIQUE (order_id, product_id),
  CONSTRAINT "product_reviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))),
  CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

ALTER TABLE "public"."product_reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX product_reviews_product_id_idx ON public.product_reviews USING btree (product_id);

CREATE INDEX product_reviews_user_id_idx ON public.product_reviews USING btree (user_id);

CREATE POLICY "product_reviews_public_read" ON "public"."product_reviews"
  FOR SELECT
  TO PUBLIC
  USING (true);

REVOKE ALL ON TABLE "public"."product_reviews" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."product_reviews" TO "anon";

REVOKE ALL ON TABLE "public"."product_reviews" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."product_reviews" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_reviews" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_reviews" TO "postgres";

REVOKE ALL ON TABLE "public"."product_reviews" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."product_reviews" TO "service_role";
