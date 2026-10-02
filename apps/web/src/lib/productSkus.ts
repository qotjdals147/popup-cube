import type { ProductSku } from '@popup-cube/shared';
import { supabase } from './supabase';

export interface OwnerSkuRow {
  color: string;
  size: string;
  stock_quantity: number;
}

export async function getProductSkus(productId: string): Promise<ProductSku[]> {
  const { data, error } = await supabase.rpc('get_product_skus', { p_product_id: productId });
  if (error) throw error;
  return (data ?? []) as ProductSku[];
}

export async function getOwnerProductSkus(productId: string): Promise<ProductSku[]> {
  const { data, error } = await supabase.rpc('get_owner_product_skus', { p_product_id: productId });
  if (error) throw error;
  return (data ?? []) as ProductSku[];
}

export async function saveOwnerProductSkus(productId: string, rows: OwnerSkuRow[]): Promise<void> {
  const payload = rows
    .filter((r) => r.color.trim() || r.size.trim())
    .map((r, i) => ({
      color: r.color.trim(),
      size: r.size.trim(),
      stock_quantity: r.stock_quantity,
      sort_order: i,
      is_active: true,
    }));
  const { error } = await supabase.rpc('save_owner_product_skus', {
    p_product_id: productId,
    p_rows: payload,
  });
  if (error) throw error;
}
