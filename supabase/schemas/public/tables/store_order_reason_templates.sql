CREATE TABLE "public"."store_order_reason_templates" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "store_id"      character varying        NOT NULL,
  "template_kind" character varying(10)    NOT NULL,
  "reason_code"   character varying(40)    NOT NULL,
  "label"         text                     NOT NULL,
  "sort_order"    integer                  NOT NULL DEFAULT 0,
  "is_active"     boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "store_order_reason_templates_code_check"
    CHECK
    (((reason_code)::text = ANY ((ARRAY['address_issue'::character varying, 'line_stock_short'::character varying, 'gacha_prize_oos'::character varying, 'other'::character varying,
    'policy_violation'::character varying, 'cannot_fulfill'::character varying])::text[]))),
  CONSTRAINT "store_order_reason_templates_kind_check" CHECK (((template_kind)::text = ANY ((ARRAY['hold'::character varying, 'reject'::character varying])::text[]))),
  CONSTRAINT "store_order_reason_templates_pkey" PRIMARY KEY (id),
  CONSTRAINT "store_order_reason_templates_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."store_order_reason_templates"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX store_order_reason_templates_store_idx ON public.store_order_reason_templates USING btree (store_id, template_kind);

CREATE POLICY "store_order_reason_templates_owner" ON "public"."store_order_reason_templates"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_order_reason_templates.store_id)::text) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_order_reason_templates.store_id)::text) AND (s.owner_id = auth.uid())))));

REVOKE ALL ON TABLE "public"."store_order_reason_templates" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_order_reason_templates" TO "anon";

REVOKE ALL ON TABLE "public"."store_order_reason_templates" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_order_reason_templates" TO "authenticated";

REVOKE ALL ON TABLE "public"."store_order_reason_templates" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."store_order_reason_templates" TO "postgres";

REVOKE ALL ON TABLE "public"."store_order_reason_templates" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_order_reason_templates" TO "service_role";
