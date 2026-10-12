CREATE TABLE "public"."product_skus" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_id"     uuid                     NOT NULL,
  "stock_quantity" integer                  NOT NULL DEFAULT 0,
  "is_active"      boolean                  NOT NULL DEFAULT true,
  "sort_order"     smallint                 NOT NULL DEFAULT 0,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "price_delta"    integer                  NOT NULL DEFAULT 0,
  "option_values"  jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT "product_skus_option_values_present" CHECK (((jsonb_typeof(option_values) = 'array'::text) AND (jsonb_array_length(option_values) > 0))),
  CONSTRAINT "product_skus_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_skus_price_delta_range" CHECK (((price_delta >= '-5000000'::integer) AND (price_delta <= 5000000))),
  CONSTRAINT "product_skus_stock_quantity_check" CHECK ((stock_quantity >= 0)),
  CONSTRAINT "product_skus_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

ALTER TABLE "public"."product_skus"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX product_skus_product_id_idx ON public.product_skus USING btree (product_id);

CREATE POLICY "product_skus_public_read" ON "public"."product_skus"
  FOR SELECT
  TO PUBLIC
  USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_skus.product_id) AND (p.is_active = true))))));

REVOKE ALL ON TABLE "public"."product_skus" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."product_skus" TO "anon";

REVOKE ALL ON TABLE "public"."product_skus" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."product_skus" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_skus" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_skus" TO "postgres";

REVOKE ALL ON TABLE "public"."product_skus" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."product_skus" TO "service_role";
