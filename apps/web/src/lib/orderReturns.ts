import type { OrderReturnDetail, OrderReturnKind, ReturnReasonCode } from '@popup-cube/shared';

import { supabase } from './supabase';
import { OrderError } from './orders';

export const MAX_RETURN_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const MAX_RETURN_EVIDENCE_IMAGES = 3;

export interface RequestReturnInput {
  kind: OrderReturnKind;
  reasonCode: ReturnReasonCode;
  reasonDetail?: string | null;
  items: { order_item_id: string; quantity: number }[];
  exchangeMemo?: string | null;
  evidenceUrls?: string[];
}

async function uploadReturnEvidence(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/return-evidence/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) throw new OrderError(error.message);

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadReturnEvidenceFiles(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files.slice(0, MAX_RETURN_EVIDENCE_IMAGES)) {
    if (file.size > MAX_RETURN_EVIDENCE_BYTES) continue;
    urls.push(await uploadReturnEvidence(userId, file));
  }
  return urls;
}

function mapReturnDetail(row: Record<string, unknown>): OrderReturnDetail {
  const rawItems = row.items;
  const items = Array.isArray(rawItems)
    ? (rawItems as { order_item_id: string; quantity: number }[])
    : [];
  const rawEvidence = row.evidence_urls;
  const evidence_urls = Array.isArray(rawEvidence) ? (rawEvidence as string[]) : [];

  return {
    return_id: String(row.return_id),
    order_id: String(row.order_id),
    kind: row.kind as OrderReturnDetail['kind'],
    reason_code: String(row.reason_code),
    reason_detail: (row.reason_detail as string | null) ?? null,
    status: row.status as OrderReturnDetail['status'],
    items,
    exchange_memo: (row.exchange_memo as string | null) ?? null,
    return_recipient_name: (row.return_recipient_name as string | null) ?? null,
    return_phone: (row.return_phone as string | null) ?? null,
    return_postal_code: (row.return_postal_code as string | null) ?? null,
    return_address_line1: (row.return_address_line1 as string | null) ?? null,
    return_address_line2: (row.return_address_line2 as string | null) ?? null,
    gacha_return_status: (row.gacha_return_status as OrderReturnDetail['gacha_return_status']) ?? null,
    owner_reply: (row.owner_reply as string | null) ?? null,
    evidence_urls,
    requested_at: String(row.requested_at),
    resolved_at: (row.resolved_at as string | null) ?? null,
  };
}

export async function requestReturn(orderId: string, input: RequestReturnInput): Promise<string> {
  const { data, error } = await supabase.rpc('request_return', {
    p_order_id: orderId,
    p_kind: input.kind,
    p_reason_code: input.reasonCode,
    p_reason_detail: input.reasonDetail?.trim() || null,
    p_items: input.items,
    p_exchange_memo: input.exchangeMemo?.trim() || null,
    p_evidence_urls: input.evidenceUrls ?? [],
  });

  if (error) {
    if (error.message.includes('return_already_active')) throw new OrderError('return_already_active');
    if (error.message.includes('exchange_not_allowed')) throw new OrderError('exchange_not_allowed');
    if (error.message.includes('change_of_mind_not_allowed')) throw new OrderError('change_of_mind_not_allowed');
    if (error.message.includes('change_of_mind_expired')) throw new OrderError('change_of_mind_expired');
    if (error.message.includes('return_address_missing')) throw new OrderError('return_address_missing');
    if (error.message.includes('reason_detail_required')) throw new OrderError('reason_detail_required');
    throw new OrderError(error.message);
  }

  return String(data);
}

export async function approveReturn(returnId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_return', { p_return_id: returnId });
  if (error) throw new OrderError(error.message);
}

export async function rejectReturn(returnId: string, reply: string): Promise<void> {
  const { error } = await supabase.rpc('reject_return', {
    p_return_id: returnId,
    p_reply: reply,
  });
  if (error) throw new OrderError(error.message);
}

export async function completeReturn(returnId: string): Promise<void> {
  const { error } = await supabase.rpc('complete_return', { p_return_id: returnId });
  if (error) {
    if (error.message.includes('gacha_return_pending')) throw new OrderError('gacha_return_pending');
    throw new OrderError(error.message);
  }
}

export async function setGachaReturnStatus(returnId: string, status: 'pending' | 'returned' | 'not_returnable'): Promise<void> {
  const { error } = await supabase.rpc('set_gacha_return_status', {
    p_return_id: returnId,
    p_status: status,
  });
  if (error) throw new OrderError(error.message);
}

export async function getOrderReturn(orderId: string): Promise<OrderReturnDetail | null> {
  const { data, error } = await supabase.rpc('get_order_return', { p_order_id: orderId });
  if (error) throw new OrderError(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return mapReturnDetail(row as Record<string, unknown>);
}
