import { supabase } from './supabase';

export interface ProductTagRow {
  label: string;
  sort_order: number;
}

export async function getProductTags(productId: string): Promise<ProductTagRow[]> {
  const { data, error } = await supabase.rpc('get_product_tags', { p_product_id: productId });
  if (error) throw error;
  return (data ?? []) as ProductTagRow[];
}

export async function getOwnerProductTags(productId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_owner_product_tags', { p_product_id: productId });
  if (error) throw error;
  const rows = (data ?? []) as ProductTagRow[];
  return rows.sort((a, b) => a.sort_order - b.sort_order).map((r) => r.label);
}

export async function saveOwnerProductTags(productId: string, labels: string[]): Promise<void> {
  const { error } = await supabase.rpc('save_owner_product_tags', {
    p_product_id: productId,
    p_labels: labels,
  });
  if (error) throw error;
}
