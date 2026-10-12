CREATE TABLE "public"."store_promotions" (
  "store_id"           character varying(64)    NOT NULL,
  "discount_percent"   integer                  NOT NULL,
  "is_active"          boolean                  NOT NULL DEFAULT true,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "default_promo_mode" character varying        NOT NULL DEFAULT 'choice'::character varying,
  CONSTRAINT "store_promotions_default_promo_mode_check"
    CHECK
    (((default_promo_mode)::text = ANY ((ARRAY['none'::character varying, 'discount_only'::character varying, 'gacha_only'::character varying, 'choice'::character
    varying])::text[]))),
  CONSTRAINT "store_promotions_discount_percent_check" CHECK (((discount_percent > 0) AND (discount_percent <= 100))),
  CONSTRAINT "store_promotions_pkey" PRIMARY KEY (store_id),
  CONSTRAINT "store_promotions_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

ALTER TABLE "public"."store_promotions"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_promotions_owner_all" ON "public"."store_promotions"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_promotions.store_id)::text) AND (s.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores s
  WHERE (((s.id)::text = (store_promotions.store_id)::text) AND (s.owner_id = auth.uid())))));

CREATE POLICY "store_promotions_public_read" ON "public"."store_promotions"
  FOR SELECT
  TO PUBLIC
  USING ((is_active = true));

REVOKE ALL ON TABLE "public"."store_promotions" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."store_promotions" TO "anon";

REVOKE ALL ON TABLE "public"."store_promotions" FROM "authenticated";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."store_promotions" TO "authenticated";

REVOKE ALL ON TABLE "public"."store_promotions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."store_promotions" TO "postgres";

REVOKE ALL ON TABLE "public"."store_promotions" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."store_promotions" TO "service_role";
