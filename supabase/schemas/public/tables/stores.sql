CREATE TABLE "public"."stores" (
  "id"                            character varying(64)    NOT NULL,
  "name"                          character varying(120)   NOT NULL,
  "owner_id"                      uuid,
  "map_config"                    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "max_channel_capacity"          integer                  NOT NULL DEFAULT 40,
  "is_active"                     boolean                  NOT NULL DEFAULT true,
  "popup_ends_at"                 timestamp with time zone,
  "created_at"                    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                    timestamp with time zone NOT NULL DEFAULT now(),
  "description"                   text,
  "thumbnail_url"                 text,
  "status"                        character varying(20)    NOT NULL DEFAULT 'draft'::character varying,
  "store_code"                    character varying(12)    NOT NULL,
  "cs_phone"                      text,
  "cs_email"                      text,
  "return_recipient_name"         text,
  "return_phone"                  text,
  "return_postal_code"            text,
  "return_address_line1"          text,
  "return_address_line2"          text,
  "shipping_guide"                text,
  "exchange_return_guide"         text,
  "shipping_fee_type"             character varying        NOT NULL DEFAULT 'free'::character varying,
  "shipping_fee_amount"           integer                  NOT NULL DEFAULT 0,
  "shipping_free_threshold"       integer                  NOT NULL DEFAULT 0,
  "default_return_address_id"     uuid,
  "return_change_of_mind_allowed" boolean                  NOT NULL DEFAULT true,
  "return_change_of_mind_days"    integer                  NOT NULL DEFAULT 7,
  "exchange_allowed"              boolean                  NOT NULL DEFAULT true,
  CONSTRAINT "stores_capacity_positive" CHECK ((max_channel_capacity > 0)),
  CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT "stores_pkey" PRIMARY KEY (id),
  CONSTRAINT "stores_shipping_fee_amount_nonneg" CHECK ((shipping_fee_amount >= 0)),
  CONSTRAINT "stores_shipping_fee_type_check"
    CHECK (((shipping_fee_type)::text = ANY ((ARRAY['free'::character varying, 'flat'::character varying, 'conditional_free'::character varying])::text[]))),
  CONSTRAINT "stores_shipping_free_threshold_nonneg" CHECK ((shipping_free_threshold >= 0)),
  CONSTRAINT "stores_status_check" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying])::text[]))),
  CONSTRAINT "stores_store_code_format" CHECK (((store_code)::text ~ '^[A-Z0-9]{2,12}$'::text))
);

ALTER TABLE "public"."stores"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_stores_active ON public.stores USING btree (is_active)
  WHERE (is_active = true);

CREATE INDEX idx_stores_owner_id ON public.stores USING btree (owner_id);

CREATE UNIQUE INDEX stores_store_code_key ON public.stores USING btree (store_code);

CREATE POLICY "stores_owner_insert" ON "public"."stores"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "stores_owner_update" ON "public"."stores"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = owner_id));

CREATE POLICY "stores_public_read" ON "public"."stores"
  FOR SELECT
  TO PUBLIC
  USING ((is_active = true));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."stores" TO "service_role";

REVOKE ALL ON TABLE "public"."stores" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."stores" TO "anon";

REVOKE ALL ON TABLE "public"."stores" FROM "authenticated";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."stores" TO "authenticated";

REVOKE ALL ON TABLE "public"."stores" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."stores" TO "postgres";
