CREATE TABLE "public"."store_return_addresses" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "store_id"       character varying        NOT NULL,
  "label"          character varying(40)    NOT NULL,
  "recipient_name" character varying(60)    NOT NULL,
  "phone"          character varying(20)    NOT NULL,
  "postal_code"    character varying(10)    NOT NULL,
  "address_line1"  character varying(200)   NOT NULL,
  "address_line2"  character varying(200),
  "is_default"     boolean                  NOT NULL DEFAULT false,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "store_return_addresses_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."store_return_addresses"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX store_return_addresses_store_id_idx ON public.store_return_addresses USING btree (store_id);

CREATE TRIGGER store_return_addresses_sync_cache
  AFTER INSERT OR DELETE OR UPDATE ON public.store_return_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_store_return_address_cache();

CREATE POLICY "store_return_addresses_delete_owner" ON "public"."store_return_addresses"
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_return_addresses.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "store_return_addresses_insert_owner" ON "public"."store_return_addresses"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_return_addresses.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "store_return_addresses_select_owner" ON "public"."store_return_addresses"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_return_addresses.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "store_return_addresses_update_owner" ON "public"."store_return_addresses"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_return_addresses.store_id)::text) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_return_addresses.store_id)::text) AND (s.owner_id = auth.uid())))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."store_return_addresses" TO "authenticated";

REVOKE ALL ON TABLE "public"."store_return_addresses" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_return_addresses" TO "anon";

REVOKE ALL ON TABLE "public"."store_return_addresses" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."store_return_addresses" TO "postgres";

REVOKE ALL ON TABLE "public"."store_return_addresses" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_return_addresses" TO "service_role";
