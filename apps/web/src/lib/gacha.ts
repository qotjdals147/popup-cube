import type { GachaRollResult, StorePromotion } from '@popup-cube/shared';
import { supabase } from './supabase';

/**
 * 매장의 활성 할인 프로모션 조회 (RLS `store_promotions_public_read` — 누구나 조회 가능).
 * 없으면 null(그 매장은 지금 할인 프로모션이 꺼져 있음).
 */
export async function getActivePromotion(storeId: string): Promise<StorePromotion | null> {
  const { data, error } = await supabase
    .from('store_promotions')
    .select('store_id, discount_percent, is_active')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export class GachaError extends Error {}

/**
 * 가챠 뽑기 — 서버(`roll_gacha` SECURITY DEFINER 함수)가 가중치 랜덤으로 결과를 정하고
 * 기록까지 남김. 클라이언트는 결과만 받아서 보여줌(조작 불가능).
 */
export async function rollGacha(storeId: string): Promise<GachaRollResult> {
  const { data, error } = await supabase.rpc('roll_gacha', { p_store_id: storeId });

  if (error) throw new GachaError(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) throw new GachaError('empty_result');
  return result;
}
