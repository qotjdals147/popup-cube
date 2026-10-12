CREATE TABLE "public"."gacha_rolls" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid                     NOT NULL,
  "store_id"      character varying(64)    NOT NULL,
  "pool_entry_id" uuid                     NOT NULL,
  "rolled_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "order_id"      uuid,
  CONSTRAINT "gacha_rolls_pkey" PRIMARY KEY (id),
  CONSTRAINT "gacha_rolls_pool_entry_id_fkey" FOREIGN KEY (pool_entry_id) REFERENCES public.gacha_pool_entries(id),
  CONSTRAINT "gacha_rolls_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "gacha_rolls_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT "gacha_rolls_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."gacha_rolls"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX gacha_rolls_order_id_idx ON public.gacha_rolls USING btree (order_id);

CREATE INDEX gacha_rolls_user_id_idx ON public.gacha_rolls USING btree (user_id);

CREATE POLICY "gacha_rolls_self_read" ON "public"."gacha_rolls"
  FOR SELECT
  TO PUBLIC
  USING ((user_id = auth.uid()));

REVOKE ALL ON TABLE "public"."gacha_rolls" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."gacha_rolls" TO "anon";

REVOKE ALL ON TABLE "public"."gacha_rolls" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."gacha_rolls" TO "authenticated";

REVOKE ALL ON TABLE "public"."gacha_rolls" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gacha_rolls" TO "postgres";

REVOKE ALL ON TABLE "public"."gacha_rolls" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."gacha_rolls" TO "service_role";
