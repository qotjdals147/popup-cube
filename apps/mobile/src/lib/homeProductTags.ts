import { getSupabase } from './supabase';

export interface HomeProductTagLink {
  product_id: string;
  label: string;
}

export interface HomeTagFacet {
  label: string;
  productCount: number;
}

export async function getHomeProductTagsForFeed(): Promise<HomeProductTagLink[]> {
  const { data, error } = await getSupabase().rpc('get_home_product_tags_for_feed');
  if (error) throw error;
  return (data ?? []) as HomeProductTagLink[];
}

export function buildHomeTagFacets(links: HomeProductTagLink[]): HomeTagFacet[] {
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

export function buildHomeProductTagMap(links: HomeProductTagLink[]): Map<string, string[]> {
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

export function homeProductMatchesTag(
  productId: string,
  tagLabel: string | null,
  tagMap: Map<string, string[]>,
): boolean {
  if (!tagLabel) return true;
  return tagMap.get(productId)?.includes(tagLabel) ?? false;
}
