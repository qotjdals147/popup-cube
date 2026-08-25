import type { ProductPromoMode, StoreDefaultPromoMode, StorePromotion } from '@popup-cube/shared';
import { supabase } from './supabase';

export type { StorePromotion };

export interface GachaPoolRow {
  id: string;
  store_id: string;
  name: string;
  is_active: boolean;
}

export interface GachaEntryRow {
  id: string;
  pool_id: string;
  product_id: string | null;
  exclusive_name: string | null;
  exclusive_image_url: string | null;
  weight: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductPromoRow {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  promo_mode: ProductPromoMode;
  promo_discount_percent: number | null;
}

export async function getStorePromotion(storeId: string): Promise<StorePromotion | null> {
  const { data, error } = await supabase
    .from('store_promotions')
    .select('store_id, discount_percent, is_active, default_promo_mode')
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertStorePromotion(
  storeId: string,
  input: {
    is_active: boolean;
    discount_percent: number;
    default_promo_mode: StoreDefaultPromoMode;
  },
): Promise<StorePromotion> {
  const { data, error } = await supabase
    .from('store_promotions')
    .upsert({
      store_id: storeId,
      is_active: input.is_active,
      discount_percent: input.discount_percent,
      default_promo_mode: input.default_promo_mode,
    })
    .select('store_id, discount_percent, is_active, default_promo_mode')
    .single();

  if (error) throw error;
  return data;
}

export async function listProductPromos(storeId: string): Promise<ProductPromoRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, is_active, promo_mode, promo_discount_percent')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateProductPromo(
  productId: string,
  promoMode: ProductPromoMode,
  promoDiscountPercent: number | null,
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      promo_mode: promoMode,
      promo_discount_percent: promoDiscountPercent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) throw error;
}

export async function bulkUpdateProductPromos(
  productIds: string[],
  promoMode: ProductPromoMode,
  promoDiscountPercent: number | null,
): Promise<void> {
  if (productIds.length === 0) return;
  const { error } = await supabase
    .from('products')
    .update({
      promo_mode: promoMode,
      promo_discount_percent: promoDiscountPercent,
      updated_at: new Date().toISOString(),
    })
    .in('id', productIds);

  if (error) throw error;
}

export async function getOrCreateStoreGachaPool(storeId: string): Promise<GachaPoolRow> {
  const { data: existing, error: readErr } = await supabase
    .from('gacha_pools')
    .select('id, store_id, name, is_active')
    .eq('store_id', storeId)
    .is('linked_product_id', null)
    .maybeSingle();

  if (readErr) throw readErr;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('gacha_pools')
    .insert({
      store_id: storeId,
      name: '매장 공용 풀',
      linked_product_id: null,
      is_active: true,
    })
    .select('id, store_id, name, is_active')
    .single();

  if (error) throw error;
  return data;
}

export async function setGachaPoolActive(poolId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('gacha_pools').update({ is_active: isActive }).eq('id', poolId);
  if (error) throw error;
}

export async function listGachaEntries(poolId: string): Promise<GachaEntryRow[]> {
  const { data, error } = await supabase
    .from('gacha_pool_entries')
    .select(
      'id, pool_id, product_id, exclusive_name, exclusive_image_url, weight, is_active, created_at',
    )
    .eq('pool_id', poolId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as GachaEntryRow[];
}

export async function addExclusiveGachaEntry(
  poolId: string,
  input: { exclusive_name: string; exclusive_image_url?: string | null; weight: number },
): Promise<void> {
  const { error } = await supabase.from('gacha_pool_entries').insert({
    pool_id: poolId,
    product_id: null,
    exclusive_name: input.exclusive_name.trim(),
    exclusive_image_url: input.exclusive_image_url?.trim() || null,
    weight: input.weight,
    is_active: true,
  });
  if (error) throw error;
}

export async function addProductGachaEntry(
  poolId: string,
  productId: string,
  weight: number,
): Promise<void> {
  const { error } = await supabase.from('gacha_pool_entries').insert({
    pool_id: poolId,
    product_id: productId,
    exclusive_name: null,
    exclusive_image_url: null,
    weight,
    is_active: true,
  });
  if (error) throw error;
}

export async function updateGachaEntry(
  entryId: string,
  patch: { weight?: number; is_active?: boolean; exclusive_name?: string },
): Promise<void> {
  const { error } = await supabase.from('gacha_pool_entries').update(patch).eq('id', entryId);
  if (error) throw error;
}

export async function deleteGachaEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('gacha_pool_entries').delete().eq('id', entryId);
  if (error) throw error;
}

export async function ownerHasActiveGachaPool(storeId: string): Promise<boolean> {
  const { data: pool, error: poolErr } = await supabase
    .from('gacha_pools')
    .select('id')
    .eq('store_id', storeId)
    .is('linked_product_id', null)
    .eq('is_active', true)
    .maybeSingle();

  if (poolErr) throw poolErr;
  if (!pool) return false;

  const { count, error: countErr } = await supabase
    .from('gacha_pool_entries')
    .select('id', { count: 'exact', head: true })
    .eq('pool_id', pool.id)
    .eq('is_active', true)
    .gt('weight', 0);

  if (countErr) throw countErr;
  return (count ?? 0) > 0;
}

export async function getProductPromosByIds(
  productIds: string[],
): Promise<Record<string, { promo_mode: ProductPromoMode; promo_discount_percent: number | null }>> {
  if (productIds.length === 0) return {};
  const { data, error } = await supabase
    .from('products')
    .select('id, promo_mode, promo_discount_percent')
    .in('id', productIds);

  if (error) throw error;
  return Object.fromEntries(
    (data ?? []).map((row) => [
      row.id,
      { promo_mode: row.promo_mode as ProductPromoMode, promo_discount_percent: row.promo_discount_percent },
    ]),
  );
}
export async function shopperStoreHasGachaPool(storeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('store_has_active_gacha_pool', {
    p_store_id: storeId,
  });
  if (error) {
    if (error.message.includes('store_has_active_gacha_pool')) return false;
    throw error;
  }
  return !!data;
}
