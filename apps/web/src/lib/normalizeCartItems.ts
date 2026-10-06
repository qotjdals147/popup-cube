import type { CartItem } from '@popup-cube/shared';

/** localStorage / 네이티브 브릿지 — 옵션 SKU 필드 보존 (ISS-059) */
export function normalizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const productId = typeof o.productId === 'string' ? o.productId : '';
    const storeId = typeof o.storeId === 'string' ? o.storeId : '';
    if (!productId || !storeId) continue;
    const skuRaw = o.skuId ?? o.sku_id;
    const skuId =
      typeof skuRaw === 'string' && skuRaw.trim() ? skuRaw.trim() : skuRaw === null ? null : null;
    const optionRaw = o.optionLabel ?? o.option_label;
    const optionLabel =
      typeof optionRaw === 'string' ? optionRaw : optionRaw === null ? null : null;
    out.push({
      productId,
      storeId,
      name: typeof o.name === 'string' ? o.name : '',
      price: typeof o.price === 'number' ? o.price : Number(o.price) || 0,
      imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : o.imageUrl === null ? null : null,
      quantity: typeof o.quantity === 'number' ? Math.max(1, o.quantity) : 1,
      skuId,
      optionLabel,
    });
  }
  return out;
}
