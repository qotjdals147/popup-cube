CREATE TABLE "public"."order_place_idempotency" (
  "user_id"         uuid                     NOT NULL,
  "store_id"        character varying        NOT NULL,
  "idempotency_key" text                     NOT NULL,
  "order_id"        uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_place_idempotency_key_len" CHECK (((char_length(idempotency_key) >= 8) AND (char_length(idempotency_key) <= 128))),
  CONSTRAINT "order_place_idempotency_pkey" PRIMARY KEY (user_id, store_id, idempotency_key),
  CONSTRAINT "order_place_idempotency_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

ALTER TABLE "public"."order_place_idempotency"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX order_place_idempotency_order_id_idx ON public.order_place_idempotency USING btree (order_id);

CREATE POLICY "order_place_idempotency_no_direct_api" ON "public"."order_place_idempotency"
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE "public"."order_place_idempotency" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_place_idempotency" TO "anon";

REVOKE ALL ON TABLE "public"."order_place_idempotency" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_place_idempotency" TO "authenticated";

REVOKE ALL ON TABLE "public"."order_place_idempotency" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_place_idempotency" TO "postgres";

REVOKE ALL ON TABLE "public"."order_place_idempotency" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_place_idempotency" TO "service_role";
