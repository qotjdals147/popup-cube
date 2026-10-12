import { getSupabase } from './supabase';

export type HomeFeedSort = 'all' | 'new' | 'ending';

export interface HomeProductFeedItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  store_id: string;
  store_name: string;
  popup_ends_at: string | null;
  created_at: string;
}

type Row = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  store_id: string;
  created_at: string;
  stores: {
    name: string;
    popup_ends_at: string | null;
    status: string;
    is_active: boolean;
  };
};

export async function listHomeProductFeed(search?: string): Promise<HomeProductFeedItem[]> {
  let query = getSupabase()
    .from('products')
    .select(
      `
      id,
      name,
      price,
      image_url,
      store_id,
      created_at,
      stores!inner (
        name,
        popup_ends_at,
        status,
        is_active
      )
    `,
    )
    .eq('is_active', true)
    .eq('stores.status', 'published')
    .eq('stores.is_active', true)
    .order('created_at', { ascending: false })
    .limit(120);

  const trimmed = search?.trim();
  if (trimmed) {
    query = query.or(`name.ilike.%${trimmed}%,product_code.ilike.%${trimmed}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  type RawRow = Omit<Row, 'stores'> & {
    stores: Row['stores'] | Row['stores'][];
  };

  return ((data ?? []) as RawRow[])
    .map((row) => {
      const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;
      if (!store) return null;
      return {
        id: row.id,
        name: row.name,
        price: row.price,
        image_url: row.image_url,
        store_id: row.store_id,
        store_name: store.name,
        popup_ends_at: store.popup_ends_at,
        created_at: row.created_at,
      };
    })
    .filter((row): row is HomeProductFeedItem => row !== null);
}

export function sortHomeProductFeed(
  items: HomeProductFeedItem[],
  sort: HomeFeedSort,
): HomeProductFeedItem[] {
  if (sort === 'all' || sort === 'new') {
    return [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }
  return [...items].sort((a, b) => {
    const ae = a.popup_ends_at ? new Date(a.popup_ends_at).getTime() : Number.MAX_SAFE_INTEGER;
    const be = b.popup_ends_at ? new Date(b.popup_ends_at).getTime() : Number.MAX_SAFE_INTEGER;
    return ae - be;
  });
}
