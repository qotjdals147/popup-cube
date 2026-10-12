CREATE TABLE "public"."user_push_tokens" (
  "user_id"         uuid                     NOT NULL,
  "expo_push_token" text                     NOT NULL,
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_push_tokens_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "user_push_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."user_push_tokens"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_push_tokens_own" ON "public"."user_push_tokens"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

REVOKE ALL ON TABLE "public"."user_push_tokens" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_push_tokens" TO "anon";

REVOKE ALL ON TABLE "public"."user_push_tokens" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_push_tokens" TO "authenticated";

REVOKE ALL ON TABLE "public"."user_push_tokens" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_push_tokens" TO "postgres";

REVOKE ALL ON TABLE "public"."user_push_tokens" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_push_tokens" TO "service_role";
