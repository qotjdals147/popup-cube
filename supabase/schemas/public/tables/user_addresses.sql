CREATE TABLE "public"."user_addresses" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "label"          character varying(40)    NOT NULL,
  "recipient_name" character varying(60)    NOT NULL,
  "phone"          character varying(20)    NOT NULL,
  "postal_code"    character varying(10)    NOT NULL,
  "address_line1"  character varying(200)   NOT NULL,
  "address_line2"  character varying(200),
  "is_default"     boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_addresses_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."user_addresses"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX user_addresses_user_id_idx ON public.user_addresses USING btree (user_id);

CREATE POLICY "user_addresses_delete_own" ON "public"."user_addresses"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "user_addresses_insert_own" ON "public"."user_addresses"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "user_addresses_select_own" ON "public"."user_addresses"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "user_addresses_update_own" ON "public"."user_addresses"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_addresses" TO "authenticated";

REVOKE ALL ON TABLE "public"."user_addresses" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_addresses" TO "anon";

REVOKE ALL ON TABLE "public"."user_addresses" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_addresses" TO "postgres";

REVOKE ALL ON TABLE "public"."user_addresses" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_addresses" TO "service_role";
