CREATE TABLE "public"."profiles" (
  "id"            uuid                     NOT NULL,
  "email"         character varying(255)   NOT NULL,
  "username"      character varying(50),
  "role"          character varying(20)    NOT NULL DEFAULT 'shopper'::character varying,
  "store_id"      character varying(64),
  "avatar_config" jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "nickname"      character varying(20),
  CONSTRAINT "nickname_length_chk" CHECK (((nickname IS NULL) OR ((char_length((nickname)::text) >= 2) AND (char_length((nickname)::text) <= 16)))),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK (((role)::text = ANY ((ARRAY['shopper'::character varying, 'owner'::character varying, 'admin'::character varying])::text[]))),
  CONSTRAINT "profiles_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_role ON public.profiles USING btree (ROLE);

CREATE UNIQUE INDEX profiles_nickname_unique_idx ON public.profiles USING btree (lower((nickname)::text))
  WHERE (nickname IS NOT NULL);

CREATE POLICY "profiles_self_select" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = id));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";
