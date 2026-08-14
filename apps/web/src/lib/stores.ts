import type { StorePolicy, StoreSummary } from '@popup-cube/shared';
import { supabase } from './supabase';
import { mapStorePolicyRow, STORE_POLICY_SELECT } from './storePolicy';

const STORE_SUMMARY_SELECT = `id, name, store_code, description, thumbnail_url, status, popup_ends_at, ${STORE_POLICY_SELECT}`;

function mapStoreSummary(row: Record<string, unknown>): StoreSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    store_code: String(row.store_code ?? ''),
    description: (row.description as string | null) ?? null,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    status: row.status as StoreSummary['status'],
    popup_ends_at: (row.popup_ends_at as string | null) ?? null,
    ...mapStorePolicyRow(row),
  };
}

/**
 * 홈 허브(§26)용 매장 목록 조회.
 * RLS `stores_public_read` (is_active = true) 정책으로 비로그인도 조회 가능하지만,
 * 홈은 로그인 후 화면이므로 항상 로그인 상태에서 호출됨.
 */
export async function listPublishedStores(search?: string): Promise<StoreSummary[]> {
  let query = supabase
    .from('stores')
    .select(STORE_SUMMARY_SELECT)
    .eq('is_active', true)
    .eq('status', 'published')
    .order('name', { ascending: true });

  const trimmed = search?.trim();
  if (trimmed) {
    query = query.ilike('name', `%${trimmed}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapStoreSummary(row as Record<string, unknown>));
}

export async function getStoreSummary(storeId: string): Promise<StoreSummary | null> {
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_SUMMARY_SELECT)
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapStoreSummary(data as Record<string, unknown>) : null;
}

/** 점주 본인 매장 — draft 포함 (RLS owner read) */
export async function getMyStore(storeId: string): Promise<StoreSummary | null> {
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_SUMMARY_SELECT)
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapStoreSummary(data as Record<string, unknown>) : null;
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
    .select(STORE_SUMMARY_SELECT)
    .eq('owner_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapStoreSummary(row as Record<string, unknown>));
}

/** 점주 매장 운영·배송 정책 저장 (§53 P0#8·#9) */
export async function updateStorePolicy(storeId: string, policy: StorePolicy): Promise<StoreSummary> {
  const { data, error } = await supabase
    .from('stores')
    .update({
      cs_phone: policy.cs_phone?.trim() || null,
      cs_email: policy.cs_email?.trim() || null,
      return_recipient_name: policy.return_recipient_name?.trim() || null,
      return_phone: policy.return_phone?.trim() || null,
      return_postal_code: policy.return_postal_code?.trim() || null,
      return_address_line1: policy.return_address_line1?.trim() || null,
      return_address_line2: policy.return_address_line2?.trim() || null,
      shipping_guide: policy.shipping_guide?.trim() || null,
      exchange_return_guide: policy.exchange_return_guide?.trim() || null,
      shipping_fee_type: policy.shipping_fee_type,
      shipping_fee_amount: Math.max(0, Math.round(policy.shipping_fee_amount)),
      shipping_free_threshold: Math.max(0, Math.round(policy.shipping_free_threshold)),
    })
    .eq('id', storeId)
    .select(STORE_SUMMARY_SELECT)
    .single();

  if (error) throw error;
  return mapStoreSummary(data as Record<string, unknown>);
}

/** §58 #6 — 팝업 종료일 (null = 기간 뱃지 없음) */
export async function updateStorePopupEndsAt(
  storeId: string,
  popupEndsAt: string | null,
): Promise<StoreSummary> {
  const { data, error } = await supabase
    .from('stores')
    .update({ popup_ends_at: popupEndsAt })
    .eq('id', storeId)
    .select(STORE_SUMMARY_SELECT)
    .single();

  if (error) throw error;
  return mapStoreSummary(data as Record<string, unknown>);
}

/** 점주 매장 주문 코드 변경 — 주문번호 앞부분 (§53 P0#7) */
export async function updateStoreCode(storeId: string, storeCode: string): Promise<StoreSummary> {
  const code = storeCode.trim().toUpperCase();
  const { data, error } = await supabase
    .from('stores')
    .update({ store_code: code })
    .eq('id', storeId)
    .select(STORE_SUMMARY_SELECT)
    .single();

  if (error) throw error;
  return mapStoreSummary(data as Record<string, unknown>);
}

/** 점주 매장 출시 — draft → published (AD-021, Sprint 3) */
export async function publishStore(storeId: string): Promise<StoreSummary> {
  const { data, error } = await supabase
    .from('stores')
    .update({ status: 'published' })
    .eq('id', storeId)
    .select(STORE_SUMMARY_SELECT)
    .single();

  if (error) throw error;
  return mapStoreSummary(data as Record<string, unknown>);
}

/** 점주 매장 출시 해제 — published → draft (손님 월드 off) */
export async function unpublishStore(storeId: string): Promise<void> {
  const { error } = await supabase.rpc('unpublish_store', { p_store_id: storeId });
  if (error) throw error;
}

export class StoreDeleteError extends Error {
  constructor(public readonly code: 'not_owner' | 'still_published' | 'active_orders' | 'unknown') {
    super(code);
  }
}

const TERMINAL_ORDER_STATUSES = ['purchase_confirmed', 'completed', 'rejected', 'cancelled'] as const;

/** 삭제 전 UI용 — 미구매확정(활성) 주문 건수 */
export async function countActiveOrdersForStoreDelete(storeId: string): Promise<number> {
  const { data, error } = await supabase.from('orders').select('status').eq('store_id', storeId);

  if (error) throw error;
  return (data ?? []).filter(
    (row) => !(TERMINAL_ORDER_STATUSES as readonly string[]).includes(String(row.status))
  ).length;
}

/** 점주 매장 삭제 — draft + 활성 주문 없을 때만 (RPC) */
export async function deleteOwnerStore(storeId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_owner_store', { p_store_id: storeId });
  if (!error) return;

  if (error.message.includes('not_store_owner')) {
    throw new StoreDeleteError('not_owner');
  }
  if (error.message.includes('store_still_published')) {
    throw new StoreDeleteError('still_published');
  }
  if (error.message.includes('store_has_active_orders')) {
    throw new StoreDeleteError('active_orders');
  }
  throw new StoreDeleteError('unknown');
}
