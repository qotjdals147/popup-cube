-- Phase 4 Sprint 0 — fixture catalog + store placements + slots (AD-033, §44)
-- Applied via Supabase MCP apply_migration on popup-platform (cvrtobxkvpcpcxrcspdp)

-- Platform catalog (§42.3 — 8 fixture kinds)
CREATE TABLE IF NOT EXISTS public.fixture_templates (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  slot_count INTEGER NOT NULL CHECK (slot_count >= 1),
  size_w INTEGER NOT NULL DEFAULT 1 CHECK (size_w >= 1),
  size_d INTEGER NOT NULL DEFAULT 1 CHECK (size_d >= 1),
  sort_order INTEGER NOT NULL DEFAULT 0,
  sprite_key TEXT,
  interaction_kind TEXT NOT NULL DEFAULT 'proximity',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Placed fixture instance per store
CREATE TABLE IF NOT EXISTS public.display_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(64) NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES public.fixture_templates(id),
  origin_x INTEGER NOT NULL CHECK (origin_x >= 0),
  origin_y INTEGER NOT NULL CHECK (origin_y >= 0),
  rotation INTEGER NOT NULL DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
  label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS display_fixtures_store_id_idx ON public.display_fixtures(store_id);

-- Product slot per fixture (0 .. slot_count-1)
CREATE TABLE IF NOT EXISTS public.display_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES public.display_fixtures(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fixture_id, slot_index)
);

CREATE INDEX IF NOT EXISTS display_slots_fixture_id_idx ON public.display_slots(fixture_id);

-- Auto-create empty slots when a fixture is placed
CREATE OR REPLACE FUNCTION public.seed_display_slots_for_fixture()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_count INTEGER;
  i INTEGER;
BEGIN
  SELECT ft.slot_count INTO v_slot_count
  FROM public.fixture_templates ft
  WHERE ft.id = NEW.template_id;

  IF v_slot_count IS NULL THEN
    RAISE EXCEPTION 'Unknown fixture template: %', NEW.template_id;
  END IF;

  FOR i IN 0 .. (v_slot_count - 1) LOOP
    INSERT INTO public.display_slots (fixture_id, slot_index, sort_order)
    VALUES (NEW.id, i, i);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_display_slots ON public.display_fixtures;
CREATE TRIGGER trg_seed_display_slots
  AFTER INSERT ON public.display_fixtures
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_display_slots_for_fixture();

-- updated_at on display_fixtures
CREATE OR REPLACE FUNCTION public.set_display_fixture_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_display_fixtures_updated_at ON public.display_fixtures;
CREATE TRIGGER trg_display_fixtures_updated_at
  BEFORE UPDATE ON public.display_fixtures
  FOR EACH ROW
  EXECUTE FUNCTION public.set_display_fixture_updated_at();

-- Seed §42.3 catalog (size_w × size_d = tile footprint)
INSERT INTO public.fixture_templates (id, display_name, slot_count, size_w, size_d, sort_order, sprite_key)
VALUES
  ('table_round_3', '원형 테이블 3칸', 3, 3, 3, 10, 'table_round_3'),
  ('table_rect_4', '사각 테이블 4칸', 4, 2, 2, 20, 'table_rect_4'),
  ('rack_hanger_5', '옷걸이 5벌', 5, 1, 3, 30, 'rack_hanger_5'),
  ('rack_hanger_8', '옷걸이 8벌', 8, 1, 4, 40, 'rack_hanger_8'),
  ('shelf_wall_3', '벽 선반 3칸', 3, 1, 3, 50, 'shelf_wall_3'),
  ('pedestal_1', '단일 받침대', 1, 1, 1, 60, 'pedestal_1'),
  ('counter_1', '카운터', 1, 2, 1, 70, 'counter_1'),
  ('display_case_2', '진열 케이스 2칸', 2, 2, 1, 80, 'display_case_2')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  slot_count = EXCLUDED.slot_count,
  size_w = EXCLUDED.size_w,
  size_d = EXCLUDED.size_d,
  sort_order = EXCLUDED.sort_order,
  sprite_key = EXCLUDED.sprite_key;

-- RLS
ALTER TABLE public.fixture_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_slots ENABLE ROW LEVEL SECURITY;

-- fixture_templates: public catalog read
DROP POLICY IF EXISTS fixture_templates_public_read ON public.fixture_templates;
CREATE POLICY fixture_templates_public_read ON public.fixture_templates
  FOR SELECT
  USING (is_active = true);

-- display_fixtures: shoppers read published stores; owners full CRUD on own store
DROP POLICY IF EXISTS display_fixtures_public_read ON public.display_fixtures;
CREATE POLICY display_fixtures_public_read ON public.display_fixtures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = display_fixtures.store_id
        AND s.is_active = true
        AND s.status = 'published'
    )
  );

DROP POLICY IF EXISTS display_fixtures_owner_read ON public.display_fixtures;
CREATE POLICY display_fixtures_owner_read ON public.display_fixtures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = display_fixtures.store_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS display_fixtures_owner_insert ON public.display_fixtures;
CREATE POLICY display_fixtures_owner_insert ON public.display_fixtures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = display_fixtures.store_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS display_fixtures_owner_update ON public.display_fixtures;
CREATE POLICY display_fixtures_owner_update ON public.display_fixtures
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = display_fixtures.store_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = display_fixtures.store_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS display_fixtures_owner_delete ON public.display_fixtures;
CREATE POLICY display_fixtures_owner_delete ON public.display_fixtures
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = display_fixtures.store_id
        AND s.owner_id = auth.uid()
    )
  );

-- display_slots: public read via published store; owner via own fixture
DROP POLICY IF EXISTS display_slots_public_read ON public.display_slots;
CREATE POLICY display_slots_public_read ON public.display_slots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.display_fixtures df
      JOIN public.stores s ON s.id = df.store_id
      WHERE df.id = display_slots.fixture_id
        AND s.is_active = true
        AND s.status = 'published'
    )
  );

DROP POLICY IF EXISTS display_slots_owner_read ON public.display_slots;
CREATE POLICY display_slots_owner_read ON public.display_slots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.display_fixtures df
      JOIN public.stores s ON s.id = df.store_id
      WHERE df.id = display_slots.fixture_id
        AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS display_slots_owner_update ON public.display_slots;
CREATE POLICY display_slots_owner_update ON public.display_slots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.display_fixtures df
      JOIN public.stores s ON s.id = df.store_id
      WHERE df.id = display_slots.fixture_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.display_fixtures df
      JOIN public.stores s ON s.id = df.store_id
      WHERE df.id = display_slots.fixture_id
        AND s.owner_id = auth.uid()
    )
  );

-- Grants (ISS-012 — new tables need explicit GRANT)
GRANT SELECT ON public.fixture_templates TO anon, authenticated;
GRANT SELECT ON public.display_fixtures TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.display_fixtures TO authenticated;
GRANT SELECT ON public.display_slots TO anon, authenticated;
GRANT SELECT, UPDATE ON public.display_slots TO authenticated;
