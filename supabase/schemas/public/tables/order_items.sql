CREATE TABLE "public"."order_items" (
  "id"                    uuid                   NOT NULL DEFAULT gen_random_uuid(),
  "order_id"              uuid                   NOT NULL,
  "product_id"            uuid                   NOT NULL,
  "quantity"              integer                NOT NULL,
  "unit_price"            integer                NOT NULL,
  "line_discount_percent" integer,
  "product_sku_id"        uuid,
  "option_label"          character varying(120),
  CONSTRAINT "order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_items_quantity_check" CHECK ((quantity >= 1)),
  CONSTRAINT "order_items_unit_price_check" CHECK ((unit_price >= 0)),
  CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT "order_items_product_sku_id_fkey" FOREIGN KEY (product_sku_id) REFERENCES public.product_skus(id),
  CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id)
);

ALTER TABLE "public"."order_items"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);

CREATE POLICY "order_items_select_own" ON "public"."order_items"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))));

CREATE POLICY "order_items_select_store_owner" ON "public"."order_items"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.stores s ON (((s.id)::text = (o.store_id)::text)))
  WHERE ((o.id = order_items.order_id) AND (s.owner_id = auth.uid())))));

REVOKE ALL ON TABLE "public"."order_items" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_items" TO "anon";

REVOKE ALL ON TABLE "public"."order_items" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."order_items" TO "authenticated";

REVOKE ALL ON TABLE "public"."order_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "postgres";

REVOKE ALL ON TABLE "public"."order_items" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_items" TO "service_role";
