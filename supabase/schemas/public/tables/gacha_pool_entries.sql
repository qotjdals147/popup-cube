CREATE TABLE "public"."gacha_pool_entries" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "pool_id"             uuid                     NOT NULL,
  "product_id"          uuid,
  "exclusive_name"      character varying(120),
  "exclusive_image_url" text,
  "weight"              integer                  NOT NULL,
  "is_active"           boolean                  NOT NULL DEFAULT true,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "gacha_pool_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "gacha_pool_entries_reward_chk" CHECK (((product_id IS NOT NULL) OR (exclusive_name IS NOT NULL))),
  CONSTRAINT "gacha_pool_entries_weight_check" CHECK ((weight > 0)),
  CONSTRAINT "gacha_pool_entries_pool_id_fkey" FOREIGN KEY (pool_id) REFERENCES public.gacha_pools(id) ON DELETE CASCADE,
  CONSTRAINT "gacha_pool_entries_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

ALTER TABLE "public"."gacha_pool_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX gacha_pool_entries_pool_id_idx ON public.gacha_pool_entries USING btree (pool_id);

CREATE POLICY "gacha_pool_entries_owner_all" ON "public"."gacha_pool_entries"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (public.gacha_pools p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = gacha_pool_entries.pool_id) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.gacha_pools p
     JOIN public.stores s ON (((s.id)::text = (p.store_id)::text)))
  WHERE ((p.id = gacha_pool_entries.pool_id) AND (s.owner_id = auth.uid())))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gacha_pool_entries" TO "authenticated";

REVOKE ALL ON TABLE "public"."gacha_pool_entries" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."gacha_pool_entries" TO "anon";

REVOKE ALL ON TABLE "public"."gacha_pool_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gacha_pool_entries" TO "postgres";

REVOKE ALL ON TABLE "public"."gacha_pool_entries" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."gacha_pool_entries" TO "service_role";
