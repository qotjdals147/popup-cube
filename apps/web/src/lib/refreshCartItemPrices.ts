import type { CartItem } from '@popup-cube/shared';
import { getProductSkus } from './productSkus';
import { supabase } from './supabase';

export type RefreshCartPricesResult = {
  items: CartItem[];
  changed: boolean;
};

type ProductRow = { id: string; price: number; name: string; image_url: string | null };

async function fetchProductsByIds(productIds: string[]): Promise<Map<string, ProductRow>> {
  if (productIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('products')
    .select('id, price, name, image_url')
    .in('id', productIds);
  if (error) throw error;
  const map = new Map<string, ProductRow>();
  for (const row of data ?? []) {
    map.set(row.id, row as ProductRow);
  }
  return map;
}

/** ISS-053 — DB 최신 단가로 장바구니 스냅샷 갱신 (옵션 = product.price + sku.price_delta) */
export async function refreshCartItemPrices(items: CartItem[]): Promise<RefreshCartPricesResult> {
  if (items.length === 0) return { items, changed: false };

  const productIds = [...new Set(items.map((item) => item.productId))];
  const productById = await fetchProductsByIds(productIds);

  const skuProductIds = [...new Set(items.filter((item) => item.skuId).map((item) => item.productId))];
  const skuDeltaByKey = new Map<string, number>();
  await Promise.all(
    skuProductIds.map(async (productId) => {
      let skus: Awaited<ReturnType<typeof getProductSkus>>;
      try {
        skus = await getProductSkus(productId);
      } catch {
        return;
      }
      for (const sku of skus) {
        skuDeltaByKey.set(`${productId}:${sku.sku_id}`, sku.price_delta ?? 0);
      }
    }),
  );

  let changed = false;
  const next = items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) return item;

    let linePrice = product.price;
    if (item.skuId) {
      const key = `${item.productId}:${item.skuId}`;
      if (!skuDeltaByKey.has(key)) return item;
      linePrice += skuDeltaByKey.get(key) ?? 0;
    }

    if (linePrice === item.price) return item;
    changed = true;
    return { ...item, price: linePrice };
  });

  return { items: next, changed };
}
