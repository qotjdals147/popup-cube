CREATE TABLE "public"."fixture_templates" (
  "id"               text                     NOT NULL,
  "display_name"     text                     NOT NULL,
  "slot_count"       integer                  NOT NULL,
  "size_w"           integer                  NOT NULL DEFAULT 1,
  "size_d"           integer                  NOT NULL DEFAULT 1,
  "sort_order"       integer                  NOT NULL DEFAULT 0,
  "sprite_key"       text,
  "interaction_kind" text                     NOT NULL DEFAULT 'proximity'::text,
  "is_active"        boolean                  NOT NULL DEFAULT true,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "fixture_templates_pkey" PRIMARY KEY (id),
  CONSTRAINT "fixture_templates_size_d_check" CHECK ((size_d >= 1)),
  CONSTRAINT "fixture_templates_size_w_check" CHECK ((size_w >= 1)),
  CONSTRAINT "fixture_templates_slot_count_check" CHECK ((slot_count >= 1))
);

ALTER TABLE "public"."fixture_templates"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixture_templates_public_read" ON "public"."fixture_templates"
  FOR SELECT
  TO PUBLIC
  USING ((is_active = true));

REVOKE ALL ON TABLE "public"."fixture_templates" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."fixture_templates" TO "anon";

REVOKE ALL ON TABLE "public"."fixture_templates" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."fixture_templates" TO "authenticated";

REVOKE ALL ON TABLE "public"."fixture_templates" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."fixture_templates" TO "postgres";

REVOKE ALL ON TABLE "public"."fixture_templates" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."fixture_templates" TO "service_role";
