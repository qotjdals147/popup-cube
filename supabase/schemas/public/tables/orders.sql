CREATE TABLE "public"."orders" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "store_id"                character varying        NOT NULL,
  "user_id"                 uuid                     NOT NULL,
  "shipping_address_id"     uuid,
  "total_amount"            integer                  NOT NULL DEFAULT 0,
  "discount_percent"        integer,
  "reward_type"             character varying        NOT NULL,
  "status"                  character varying        NOT NULL DEFAULT 'paid'::character varying,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "auto_accepted"           boolean                  NOT NULL DEFAULT false,
  "accepted_at"             timestamp with time zone,
  "tracking_number"         character varying,
  "shipped_at"              timestamp with time zone,
  "delivery_completed_at"   timestamp with time zone,
  "purchase_confirmed_at"   timestamp with time zone,
  "purchase_confirm_auto"   boolean                  NOT NULL DEFAULT false,
  "order_number"            integer                  NOT NULL,
  "cancelled_at"            timestamp with time zone,
  "cancelled_by"            character varying(10),
  "claim_status"            character varying(10)    NOT NULL DEFAULT 'none'::character varying,
  "claim_message"           text,
  "claim_reply"             text,
  "claim_created_at"        timestamp with time zone,
  "claim_resolved_at"       timestamp with time zone,
  "subtotal_amount"         integer,
  "shipping_fee"            integer                  NOT NULL DEFAULT 0,
  "hold_reason_code"        character varying(40),
  "hold_reason_text"        text,
  "hold_requested_at"       timestamp with time zone,
  "hold_affected_item_ids"  uuid[],
  "supplement_submitted_at" timestamp with time zone,
  "reject_reason_code"      character varying(40),
  "reject_reason_text"      text,
  "claim_round_count"       integer                  NOT NULL DEFAULT 0,
  "return_status"           character varying        NOT NULL DEFAULT 'none'::character varying,
  "return_kind"             character varying,
  "return_reason_code"      character varying,
  "return_reason_detail"    text,
  "return_requested_at"     timestamp with time zone,
  "return_resolved_at"      timestamp with time zone,
  "return_owner_reply"      text,
  "active_return_id"        uuid,
  CONSTRAINT "orders_cancelled_by_check"
    CHECK (((cancelled_by IS NULL) OR ((cancelled_by)::text = ANY ((ARRAY['owner'::character varying, 'shopper'::character varying])::text[])))),
  CONSTRAINT "orders_claim_status_check"
    CHECK (((claim_status)::text = ANY ((ARRAY['none'::character varying, 'open'::character varying, 'resolved'::character varying])::text[]))),
  CONSTRAINT "orders_discount_percent_check" CHECK (((discount_percent > 0) AND (discount_percent <= 100))),
  CONSTRAINT "orders_hold_reason_code_check"
    CHECK
    (((hold_reason_code IS NULL) OR ((hold_reason_code)::text = ANY ((ARRAY['address_issue'::character varying, 'line_stock_short'::character varying, 'gacha_prize_oos'::character
    varying, 'other'::character varying])::text[])))),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "orders_return_kind_check"
    CHECK (((return_kind IS NULL) OR ((return_kind)::text = ANY ((ARRAY['return'::character varying, 'exchange'::character varying])::text[])))),
  CONSTRAINT "orders_return_status_check"
    CHECK
    (((return_status)::text = ANY ((ARRAY['none'::character varying, 'requested'::character varying, 'approved'::character varying, 'rejected'::character varying,
    'completed'::character varying])::text[]))),
  CONSTRAINT "orders_reward_type_check" CHECK (((reward_type)::text = ANY ((ARRAY['discount'::character varying, 'gacha'::character varying])::text[]))),
  CONSTRAINT "orders_status_check"
    CHECK
    (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'awaiting_accept'::character varying, 'on_hold'::character varying,
    'accepted'::character varying,
    'rejected'::character varying,
    'shipped'::character varying,
    'delivery_completed'::character varying, 'purchase_confirmed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
  CONSTRAINT "orders_total_amount_check" CHECK ((total_amount >= 0)),
  CONSTRAINT "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "orders_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY (shipping_address_id) REFERENCES public.user_addresses(id) ON DELETE SET NULL
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX orders_store_id_idx ON public.orders USING btree (store_id);

CREATE UNIQUE INDEX orders_store_id_order_number_key ON public.orders USING btree (store_id, order_number);

CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);

CREATE POLICY "orders_insert_own" ON "public"."orders"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "orders_select_own" ON "public"."orders"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "orders_select_store_owner" ON "public"."orders"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (orders.store_id)::text) AND (s.owner_id = auth.uid())))));

REVOKE ALL ON TABLE "public"."orders" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "anon";

REVOKE ALL ON TABLE "public"."orders" FROM "authenticated";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "authenticated";

REVOKE ALL ON TABLE "public"."orders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres";

REVOKE ALL ON TABLE "public"."orders" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "service_role";
