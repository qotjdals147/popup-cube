import { supabase } from './supabase';

export interface CoordiProductSummary {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  sort_order: number;
}

export async function getProductCoordiProducts(productId: string): Promise<CoordiProductSummary[]> {
  const { data, error } = await supabase.rpc('get_product_coordi_products', { p_product_id: productId });
  if (error) throw error;
  return (data ?? []) as CoordiProductSummary[];
}

export async function getOwnerProductCoordiLinkIds(productId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_owner_product_coordi_links', { p_product_id: productId });
  if (error) throw error;
  const rows = (data ?? []) as { linked_product_id: string; sort_order: number }[];
  return rows.sort((a, b) => a.sort_order - b.sort_order).map((r) => r.linked_product_id);
}

export async function saveOwnerProductCoordiLinks(productId: string, linkedIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('save_owner_product_coordi_links', {
    p_product_id: productId,
    p_linked_ids: linkedIds,
  });
  if (error) throw error;
}
