CREATE TABLE "public"."products" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "store_id"               character varying(64)    NOT NULL,
  "name"                   character varying(120)   NOT NULL,
  "description"            text,
  "price"                  integer                  NOT NULL,
  "image_url"              text,
  "is_active"              boolean                  NOT NULL DEFAULT true,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "stock_quantity"         integer                  NOT NULL DEFAULT 999999,
  "auto_accept_enabled"    boolean                  NOT NULL DEFAULT false,
  "auto_accept_limit"      integer                  NOT NULL DEFAULT 0,
  "auto_accept_remaining"  integer                  NOT NULL DEFAULT 0,
  "detail_description"     text,
  "promo_mode"             character varying        NOT NULL DEFAULT 'inherit'::character varying,
  "promo_discount_percent" integer,
  "product_code"           character varying(40),
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_price_check" CHECK ((price >= 0)),
  CONSTRAINT "products_promo_discount_percent_check" CHECK (((promo_discount_percent IS NULL) OR ((promo_discount_percent >= 1) AND (promo_discount_percent <= 100)))),
  CONSTRAINT "products_promo_mode_check"
    CHECK
    (((promo_mode)::text = ANY ((ARRAY['inherit'::character varying, 'none'::character varying, 'discount_only'::character varying, 'gacha_only'::character varying,
    'choice'::character varying])::text[]))),
  CONSTRAINT "products_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX products_store_id_idx ON public.products USING btree (store_id);

CREATE UNIQUE INDEX products_store_product_code_unique ON public.products USING btree (store_id, lower(btrim((product_code)::text)))
  WHERE ((product_code IS NOT NULL) AND (btrim((product_code)::text) <> ''::text));

CREATE POLICY "products_owner_insert" ON "public"."products"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (products.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "products_owner_read" ON "public"."products"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (products.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "products_owner_update" ON "public"."products"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (products.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "products_public_read" ON "public"."products"
  FOR SELECT
  TO PUBLIC
  USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (products.store_id)::text) AND (s.is_active = true) AND ((s.status)::text = 'published'::text))))));

COMMENT ON COLUMN "public"."products"."product_code" IS '점주 지정 판매자 상품코드 · 매장 내 유일 · 엑셀 「판매자 상품코드」';

REVOKE ALL ON TABLE "public"."products" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."products" TO "anon";

REVOKE ALL ON TABLE "public"."products" FROM "authenticated";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "authenticated";

REVOKE ALL ON TABLE "public"."products" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "postgres";

REVOKE ALL ON TABLE "public"."products" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."products" TO "service_role";
