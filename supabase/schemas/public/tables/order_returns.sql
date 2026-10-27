CREATE TABLE "public"."order_returns" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"              uuid                     NOT NULL,
  "store_id"              character varying        NOT NULL,
  "user_id"               uuid                     NOT NULL,
  "kind"                  character varying        NOT NULL,
  "reason_code"           character varying        NOT NULL,
  "reason_detail"         text,
  "status"                character varying        NOT NULL DEFAULT 'requested'::character varying,
  "items"                 jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "exchange_memo"         text,
  "return_recipient_name" character varying,
  "return_phone"          character varying,
  "return_postal_code"    character varying,
  "return_address_line1"  character varying,
  "return_address_line2"  character varying,
  "gacha_return_status"   character varying,
  "gacha_returned_at"     timestamp with time zone,
  "owner_reply"           text,
  "requested_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at"           timestamp with time zone,
  "evidence_urls"         text[]                   DEFAULT '{}'::text[],
  "stock_restored"        boolean,
  CONSTRAINT "order_returns_gacha_status_check"
    CHECK
    (((gacha_return_status IS NULL) OR ((gacha_return_status)::text = ANY ((ARRAY['pending'::character varying, 'returned'::character varying, 'not_returnable'::character
    varying])::text[])))),
  CONSTRAINT "order_returns_kind_check" CHECK (((kind)::text = ANY ((ARRAY['return'::character varying, 'exchange'::character varying])::text[]))),
  CONSTRAINT "order_returns_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_returns_status_check"
    CHECK
    (((status)::text = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying,
    'cancelled'::character varying])::text[]))),
  CONSTRAINT "order_returns_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "order_returns_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."order_returns"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_order_returns_store_status ON public.order_returns USING btree (store_id, status, requested_at DESC);

CREATE UNIQUE INDEX order_returns_one_active_per_order ON public.order_returns USING btree (order_id)
  WHERE ((status)::text = ANY ((ARRAY['requested'::character varying, 'approved'::character varying])::text[]));

CREATE POLICY "order_returns_no_direct_api" ON "public"."order_returns"
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE "public"."order_returns" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_returns" TO "anon";

REVOKE ALL ON TABLE "public"."order_returns" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_returns" TO "authenticated";

REVOKE ALL ON TABLE "public"."order_returns" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_returns" TO "postgres";

REVOKE ALL ON TABLE "public"."order_returns" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_returns" TO "service_role";
