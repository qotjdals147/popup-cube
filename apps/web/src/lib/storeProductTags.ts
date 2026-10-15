import { supabase } from './supabase';

export interface StoreProductTagLink {
  product_id: string;
  label: string;
}

export interface StoreTagFacet {
  label: string;
  productCount: number;
}

export async function getStoreProductTagsForShop(storeId: string): Promise<StoreProductTagLink[]> {
  const { data, error } = await supabase.rpc('get_store_product_tags_for_shop', { p_store_id: storeId });
  if (error) throw error;
  return (data ?? []) as StoreProductTagLink[];
}

export function buildStoreTagFacets(links: StoreProductTagLink[]): StoreTagFacet[] {
  const counts = new Map<string, Set<string>>();
  for (const { product_id, label } of links) {
    let set = counts.get(label);
    if (!set) {
      set = new Set();
      counts.set(label, set);
    }
    set.add(product_id);
  }
  return [...counts.entries()]
    .map(([label, set]) => ({ label, productCount: set.size }))
    .sort((a, b) => b.productCount - a.productCount || a.label.localeCompare(b.label, 'ko'));
}

/** productId → 태그 라벨 목록 */
export function buildProductTagLabelMap(links: StoreProductTagLink[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const { product_id, label } of links) {
    const prev = map.get(product_id);
    if (prev) {
      if (!prev.includes(label)) prev.push(label);
    } else {
      map.set(product_id, [label]);
    }
  }
  return map;
}

export function productMatchesTag(
  productId: string,
  tagLabel: string | null,
  tagMap: Map<string, string[]>
): boolean {
  if (!tagLabel) return true;
  return tagMap.get(productId)?.includes(tagLabel) ?? false;
}
