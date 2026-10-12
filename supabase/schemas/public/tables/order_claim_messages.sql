CREATE TABLE "public"."order_claim_messages" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"           uuid                     NOT NULL,
  "round_no"           integer                  NOT NULL,
  "shopper_message"    text                     NOT NULL,
  "owner_reply"        text,
  "shopper_created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "owner_replied_at"   timestamp with time zone,
  "status"             character varying(10)    NOT NULL DEFAULT 'open'::character varying,
  CONSTRAINT "order_claim_messages_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_claim_messages_round_unique" UNIQUE (order_id, round_no),
  CONSTRAINT "order_claim_messages_status_check" CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'resolved'::character varying])::text[]))),
  CONSTRAINT "order_claim_messages_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

ALTER TABLE "public"."order_claim_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_order_claim_messages_order_id ON public.order_claim_messages USING btree (order_id, round_no);

CREATE POLICY "order_claim_messages_no_direct_api" ON "public"."order_claim_messages"
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE "public"."order_claim_messages" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_claim_messages" TO "anon";

REVOKE ALL ON TABLE "public"."order_claim_messages" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_claim_messages" TO "authenticated";

REVOKE ALL ON TABLE "public"."order_claim_messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_claim_messages" TO "postgres";

REVOKE ALL ON TABLE "public"."order_claim_messages" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_claim_messages" TO "service_role";
