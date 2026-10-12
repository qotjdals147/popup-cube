CREATE TABLE "public"."channels" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "store_id"       character varying(64)    NOT NULL,
  "channel_number" integer                  NOT NULL,
  "redis_room_key" character varying(128)   NOT NULL,
  "is_active"      boolean                  NOT NULL DEFAULT true,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "channels_pkey" PRIMARY KEY (id),
  CONSTRAINT "channels_redis_room_key_key" UNIQUE (redis_room_key),
  CONSTRAINT "channels_store_id_channel_number_key" UNIQUE (store_id, channel_number),
  CONSTRAINT "channels_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."channels"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_channels_store_id ON public.channels USING btree (store_id);

CREATE POLICY "channels_public_read" ON "public"."channels"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."channels" TO "service_role";

REVOKE ALL ON TABLE "public"."channels" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."channels" TO "anon";

REVOKE ALL ON TABLE "public"."channels" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."channels" TO "authenticated";

REVOKE ALL ON TABLE "public"."channels" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."channels" TO "postgres";
