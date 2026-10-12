CREATE TABLE "public"."order_notifications" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "order_id"   uuid,
  "event_type" character varying(40)    NOT NULL,
  "title"      text                     NOT NULL,
  "body"       text                     NOT NULL,
  "read_at"    timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_notifications_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "order_notifications_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL
);

ALTER TABLE "public"."order_notifications"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX order_notifications_user_created_idx ON public.order_notifications USING btree (user_id, created_at DESC);

CREATE POLICY "order_notifications_select_own" ON "public"."order_notifications"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "order_notifications_update_own" ON "public"."order_notifications"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

REVOKE ALL ON TABLE "public"."order_notifications" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_notifications" TO "anon";

REVOKE ALL ON TABLE "public"."order_notifications" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_notifications" TO "authenticated";

REVOKE ALL ON TABLE "public"."order_notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_notifications" TO "postgres";

REVOKE ALL ON TABLE "public"."order_notifications" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_notifications" TO "service_role";
