import type {
  DisplayFixture,
  DisplayFixtureWithTemplate,
  DisplaySlot,
  DisplaySlotWithProduct,
  FixtureTemplate,
  Product,
} from '@popup-cube/shared';
import {
  buildOccupancyGrid,
  type BuildOccupancyGridOptions,
  type FixturePlacement,
  type OccupancyGridResult,
} from '@popup-cube/game-core';
import { supabase } from './supabase';

export type DisplayFixtureErrorCode =
  | 'NOT_FOUND'
  | 'SAVE_FAILED'
  | 'DELETE_FAILED'
  | 'INVALID_TEMPLATE'
  | 'OVERLAP';

export class DisplayFixtureError extends Error {
  code: DisplayFixtureErrorCode;
  constructor(code: DisplayFixtureErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const FIXTURE_SELECT = `
  id,
  store_id,
  template_id,
  origin_x,
  origin_y,
  rotation,
  label,
  sort_order,
  created_at,
  updated_at,
  fixture_templates (
    id,
    display_name,
    slot_count,
    size_w,
    size_d,
    sort_order,
    sprite_key,
    interaction_kind,
    is_active
  )
`;

const SLOT_SELECT = `
  id,
  fixture_id,
  slot_index,
  product_id,
  sort_order,
  created_at,
  products (
    id,
    store_id,
    name,
    description,
    price,
    image_url,
    is_active,
    created_at
  )
`;

type FixtureRow = DisplayFixture & {
  fixture_templates: FixtureTemplate;
};

type SlotRow = DisplaySlot & {
  products: Product | null;
};

function mapFixtureRow(row: FixtureRow): DisplayFixtureWithTemplate {
  const { fixture_templates: template, ...fixture } = row;
  return { ...fixture, template };
}

function mapSlotRow(row: SlotRow): DisplaySlotWithProduct {
  const { products: product, ...slot } = row;
  return { ...slot, product: product ?? null };
}

/** 플랫폼 카탈로그 8종 (§42.3) — 누구나 조회 가능. */
export async function listFixtureTemplates(): Promise<FixtureTemplate[]> {
  const { data, error } = await supabase
    .from('fixture_templates')
    .select(
      'id, display_name, slot_count, size_w, size_d, sort_order, sprite_key, interaction_kind, is_active'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** 매장 진열 조형물 + 템플릿 메타. */
export async function listStoreDisplayFixtures(
  storeId: string
): Promise<DisplayFixtureWithTemplate[]> {
  const { data, error } = await supabase
    .from('display_fixtures')
    .select(FIXTURE_SELECT)
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as FixtureRow[] | null)?.map(mapFixtureRow) ?? [];
}

/** 슬롯 + 연결된 상품 (published 매장 공개 / 점주 전체). */
export async function listDisplaySlotsForStore(
  storeId: string
): Promise<DisplaySlotWithProduct[]> {
  const fixtures = await listStoreDisplayFixtures(storeId);
  if (fixtures.length === 0) return [];

  const fixtureIds = fixtures.map((f) => f.id);
  const { data, error } = await supabase
    .from('display_slots')
    .select(SLOT_SELECT)
    .in('fixture_id', fixtureIds)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as SlotRow[] | null)?.map(mapSlotRow) ?? [];
}

export interface CreateDisplayFixtureInput {
  storeId: string;
  templateId: string;
  originX: number;
  originY: number;
  rotation?: 0 | 90 | 180 | 270;
  label?: string;
  sortOrder?: number;
}

/** 조형물 배치 — insert 후 trigger가 빈 슬롯 자동 생성. */
export async function createDisplayFixture(
  input: CreateDisplayFixtureInput
): Promise<DisplayFixtureWithTemplate> {
  const { data, error } = await supabase
    .from('display_fixtures')
    .insert({
      store_id: input.storeId,
      template_id: input.templateId,
      origin_x: input.originX,
      origin_y: input.originY,
      rotation: input.rotation ?? 0,
      label: input.label?.trim() || null,
      sort_order: input.sortOrder ?? 0,
    })
    .select(FIXTURE_SELECT)
    .single();

  if (error) throw new DisplayFixtureError('SAVE_FAILED', error.message);
  return mapFixtureRow(data as FixtureRow);
}

export interface UpdateDisplayFixtureInput {
  originX?: number;
  originY?: number;
  rotation?: 0 | 90 | 180 | 270;
  label?: string | null;
  sortOrder?: number;
}

export async function updateDisplayFixture(
  fixtureId: string,
  input: UpdateDisplayFixtureInput
): Promise<DisplayFixtureWithTemplate> {
  const patch: Record<string, unknown> = {};
  if (input.originX !== undefined) patch.origin_x = input.originX;
  if (input.originY !== undefined) patch.origin_y = input.originY;
  if (input.rotation !== undefined) patch.rotation = input.rotation;
  if (input.label !== undefined) patch.label = input.label?.trim() || null;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('display_fixtures')
    .update(patch)
    .eq('id', fixtureId)
    .select(FIXTURE_SELECT)
    .single();

  if (error) throw new DisplayFixtureError('SAVE_FAILED', error.message);
  return mapFixtureRow(data as FixtureRow);
}

export async function deleteDisplayFixture(fixtureId: string): Promise<void> {
  const { error } = await supabase.from('display_fixtures').delete().eq('id', fixtureId);
  if (error) throw new DisplayFixtureError('DELETE_FAILED', error.message);
}

/** 슬롯에 상품 연결 / 해제. productId null = 빈 칸. */
export async function setDisplaySlotProduct(
  slotId: string,
  productId: string | null
): Promise<DisplaySlotWithProduct> {
  const { data, error } = await supabase
    .from('display_slots')
    .update({ product_id: productId })
    .eq('id', slotId)
    .select(SLOT_SELECT)
    .single();

  if (error) throw new DisplayFixtureError('SAVE_FAILED', error.message);
  return mapSlotRow(data as SlotRow);
}

/** 손님 팝업·에디터 미리보기용 — 슬롯 순서대로 활성 상품만. */
export async function listFixtureDisplayProducts(
  fixtureId: string
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('display_slots')
    .select(SLOT_SELECT)
    .eq('fixture_id', fixtureId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  const slots = (data as SlotRow[] | null)?.map(mapSlotRow) ?? [];
  return slots
    .map((s) => s.product)
    .filter((p): p is Product => !!p && p.is_active);
}

export function toFixturePlacement(fixture: DisplayFixtureWithTemplate): FixturePlacement {
  return {
    id: fixture.id,
    templateId: fixture.template_id,
    origin: { x: fixture.origin_x, y: fixture.origin_y },
    size: { w: fixture.template.size_w, d: fixture.template.size_d },
    rotation: fixture.rotation,
    slotCount: fixture.template.slot_count,
    label: fixture.label,
  };
}

/** §44 — 매장 layout → occupancy grid (에디터 overlap / Phaser canWalk). */
export function buildStoreOccupancyGrid(
  mapWidth: number,
  mapHeight: number,
  fixtures: DisplayFixtureWithTemplate[],
  options?: Pick<BuildOccupancyGridOptions, 'walkableMask' | 'blockedTiles'>
): OccupancyGridResult {
  const placements = fixtures.map(toFixturePlacement);
  return buildOccupancyGrid(
    {
      width: mapWidth,
      height: mapHeight,
      walkableMask: options?.walkableMask,
      blockedTiles: options?.blockedTiles,
    },
    placements
  );
}

export async function loadStoreDisplayLayout(storeId: string): Promise<{
  fixtures: DisplayFixtureWithTemplate[];
  slots: DisplaySlotWithProduct[];
  occupancy: OccupancyGridResult;
  mapSize: { width: number; height: number };
}> {
  const fixtures = await listStoreDisplayFixtures(storeId);
  const slots = await listDisplaySlotsForStore(storeId);

  const { data: storeRow, error } = await supabase
    .from('stores')
    .select('map_config')
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;

  const mapConfig = storeRow?.map_config as {
    map_size?: { width: number; height: number };
    mapSize?: { width: number; height: number };
  } | null;

  const mapSize = mapConfig?.map_size ??
    mapConfig?.mapSize ?? { width: 20, height: 20 };

  const occupancy = buildStoreOccupancyGrid(mapSize.width, mapSize.height, fixtures);

  return { fixtures, slots, occupancy, mapSize };
}
