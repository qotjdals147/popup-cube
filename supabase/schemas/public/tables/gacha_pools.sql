CREATE TABLE "public"."gacha_pools" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "store_id"          character varying(64)    NOT NULL,
  "name"              character varying(120)   NOT NULL DEFAULT '가챠 뿑기'::character varying,
  "linked_product_id" uuid,
  "is_active"         boolean                  NOT NULL DEFAULT true,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "gacha_pools_pkey" PRIMARY KEY (id),
  CONSTRAINT "gacha_pools_linked_product_id_fkey" FOREIGN KEY (linked_product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT "gacha_pools_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."gacha_pools"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX gacha_pools_store_id_idx ON public.gacha_pools USING btree (store_id);

CREATE POLICY "gacha_pools_owner_all" ON "public"."gacha_pools"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (gacha_pools.store_id)::text) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (gacha_pools.store_id)::text) AND (s.owner_id = auth.uid())))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gacha_pools" TO "authenticated";

REVOKE ALL ON TABLE "public"."gacha_pools" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."gacha_pools" TO "anon";

REVOKE ALL ON TABLE "public"."gacha_pools" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gacha_pools" TO "postgres";

REVOKE ALL ON TABLE "public"."gacha_pools" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."gacha_pools" TO "service_role";
