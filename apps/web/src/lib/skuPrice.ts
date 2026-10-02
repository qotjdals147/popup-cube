/** AD-087 — 옵션 판매가 = 기본가 + delta */
export function skuUnitPrice(basePrice: number, priceDelta = 0): number {
  return basePrice + priceDelta;
}

export function formatPriceDeltaLabel(delta: number, formatPrice: (n: number) => string): string {
  if (!delta) return '';
  if (delta > 0) return ` (+${formatPrice(delta)})`;
  return ` (${formatPrice(delta)})`;
}
