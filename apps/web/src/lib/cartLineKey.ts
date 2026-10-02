import type { CartItem } from '@popup-cube/shared';

/** AD-085 — 같은 상품·다른 옵션은 별도 장바구니 줄 */
export function cartLineKey(item: Pick<CartItem, 'productId' | 'skuId'>): string {
  return item.skuId ? `${item.productId}:${item.skuId}` : item.productId;
}
