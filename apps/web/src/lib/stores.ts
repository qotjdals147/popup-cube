import type { StoreSummary } from '@popup-cube/shared';
import { supabase } from './supabase';

/**
 * 홈 허브(§26)용 매장 목록 조회.
 * RLS `stores_public_read` (is_active = true) 정책으로 비로그인도 조회 가능하지만,
 * 홈은 로그인 후 화면이므로 항상 로그인 상태에서 호출됨.
 */
export async function listPublishedStores(search?: string): Promise<StoreSummary[]> {
  let query = supabase
    .from('stores')
    .select('id, name, description, thumbnail_url, status')
    .eq('is_active', true)
    .eq('status', 'published')
    .order('name', { ascending: true });

  const trimmed = search?.trim();
  if (trimmed) {
    query = query.ilike('name', `%${trimmed}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getStoreSummary(storeId: string): Promise<StoreSummary | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, description, thumbnail_url, status')
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** 점주 본인 매장 — draft 포함 (RLS owner read) */
export async function getMyStore(storeId: string): Promise<StoreSummary | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, description, thumbnail_url, status')
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** 점주가 해당 매장의 소유자인지 — `stores.owner_id` 기준 (profiles.store_id와 다를 수 있음) */
export async function userOwnsStore(userId: string, storeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/** 점주 대시보드 — 본인 소유 매장 전체 (GUCCI + 테스트로 만든 매장 등) */
export async function listOwnedStores(userId: string): Promise<StoreSummary[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, description, thumbnail_url, status')
    .eq('owner_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** 점주 매장 출시 — draft → published (AD-021, Sprint 3) */
export async function publishStore(storeId: string): Promise<StoreSummary> {
  const { data, error } = await supabase
    .from('stores')
    .update({ status: 'published' })
    .eq('id', storeId)
    .select('id, name, description, thumbnail_url, status')
    .single();

  if (error) throw error;
  return data;
}
