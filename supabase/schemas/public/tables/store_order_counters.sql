CREATE TABLE "public"."store_order_counters" (
  "store_id"          character varying NOT NULL,
  "next_order_number" integer           NOT NULL DEFAULT 1,
  CONSTRAINT "store_order_counters_next_order_number_check" CHECK ((next_order_number >= 1)),
  CONSTRAINT "store_order_counters_pkey" PRIMARY KEY (store_id),
  CONSTRAINT "store_order_counters_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."store_order_counters"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_order_counters_no_direct_api" ON "public"."store_order_counters"
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE "public"."store_order_counters" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_order_counters" TO "anon";

REVOKE ALL ON TABLE "public"."store_order_counters" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_order_counters" TO "authenticated";

REVOKE ALL ON TABLE "public"."store_order_counters" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."store_order_counters" TO "postgres";

REVOKE ALL ON TABLE "public"."store_order_counters" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_order_counters" TO "service_role";
