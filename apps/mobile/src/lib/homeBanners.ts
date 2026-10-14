import { getSupabase } from './supabase';

export type HomeBannerSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  storeId: string | null;
  productId: string | null;
  /** 외부 URL — store/product보다 우선 (§7.115 L1) */
  linkUrl: string | null;
  accentColor: string;
};

const BANNER_ACCENTS = ['#3182f6', '#6366f1', '#0ea5e9', '#2563eb', '#4f46e5'] as const;

type ProductRow = {
  id: string;
  name: string;
  image_url: string | null;
  store_id: string;
  stores: { name: string; status: string; is_active: boolean } | { name: string; status: string; is_active: boolean }[];
};

type StoreRow = {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
};

function storeFromRow(row: ProductRow) {
  return Array.isArray(row.stores) ? row.stores[0] : row.stores;
}

type SponsoredBannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  store_id: string | null;
  product_id: string | null;
  link_url: string | null;
  sort_order: number;
};

function mapSponsoredToSlide(row: SponsoredBannerRow, index: number): HomeBannerSlide {
  return {
    id: `sponsored-${row.id}`,
    title: row.title,
    subtitle: row.subtitle?.trim() || '',
    imageUrl: row.image_url,
    storeId: row.store_id,
    productId: row.product_id,
    linkUrl: row.link_url?.trim() || null,
    accentColor: BANNER_ACCENTS[index % BANNER_ACCENTS.length],
  };
}

async function listSponsoredHomeBanners(): Promise<HomeBannerSlide[]> {
  const { data, error } = await getSupabase().rpc('list_home_sponsored_banners', { p_limit: 10 });
  if (error) throw error;
  const rows = (data ?? []) as SponsoredBannerRow[];
  return rows.map(mapSponsoredToSlide);
}

export async function listHomePromoBanners(fallback: {
  title: string;
  subtitle: string;
}): Promise<HomeBannerSlide[]> {
  try {
    const sponsored = await listSponsoredHomeBanners();
    if (sponsored.length >= 1) return sponsored.slice(0, 10);
  } catch {
    /* RPC 미적용·오류 시 자동 썸네일 fallback */
  }

  const { data: productData, error: productError } = await getSupabase()
    .from('products')
    .select(
      `
      id,
      name,
      image_url,
      store_id,
      created_at,
      stores!inner ( name, status, is_active )
    `,
    )
    .eq('is_active', true)
    .eq('stores.status', 'published')
    .eq('stores.is_active', true)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(12);

  if (productError) throw productError;

  const productSlides: HomeBannerSlide[] = [];
  for (const row of (productData ?? []) as ProductRow[]) {
    const store = storeFromRow(row);
    if (!store || !row.image_url) continue;
    productSlides.push({
      id: `product-${row.id}`,
      title: row.name,
      subtitle: store.name,
      imageUrl: row.image_url,
      storeId: row.store_id,
      productId: row.id,
      linkUrl: null,
      accentColor: BANNER_ACCENTS[productSlides.length % BANNER_ACCENTS.length],
    });
    if (productSlides.length >= 5) break;
  }

  if (productSlides.length >= 2) return productSlides;

  const { data: storeData, error: storeError } = await getSupabase()
    .from('stores')
    .select('id, name, description, thumbnail_url')
    .eq('status', 'published')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (storeError) throw storeError;

  const stores = (storeData ?? []) as StoreRow[];
  const storeSlides: HomeBannerSlide[] = stores.map((store, index) => ({
    id: `store-${store.id}`,
    title: store.name,
    subtitle: store.description?.trim().slice(0, 48) || fallback.subtitle,
    imageUrl: store.thumbnail_url,
    storeId: store.id,
    productId: null,
    linkUrl: null,
    accentColor: BANNER_ACCENTS[index % BANNER_ACCENTS.length],
  }));

  const merged = [...productSlides, ...storeSlides.filter((s) => !productSlides.some((p) => p.storeId === s.storeId))];
  if (merged.length > 0) return merged.slice(0, 5);

  return [
    {
      id: 'fallback-1',
      title: fallback.title,
      subtitle: fallback.subtitle,
      imageUrl: null,
      storeId: null,
      productId: null,
      linkUrl: null,
      accentColor: BANNER_ACCENTS[0],
    },
  ];
}
