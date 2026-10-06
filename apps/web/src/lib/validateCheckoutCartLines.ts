import type { CartItem } from '@popup-cube/shared';
import { getProductSkus } from './productSkus';
import { OrderError } from './orders';

/** 옵션 상품인데 skuId 없으면 place_order 전에 막음 (ISS-059/060) */
export async function validateCheckoutCartLines(lines: CartItem[]): Promise<void> {
  const needsCheck = new Set<string>();
  for (const line of lines) {
    if (line.skuId) continue;
    needsCheck.add(line.productId);
  }
  if (needsCheck.size === 0) return;

  await Promise.all(
    [...needsCheck].map(async (productId) => {
      let skus: Awaited<ReturnType<typeof getProductSkus>>;
      try {
        skus = await getProductSkus(productId);
      } catch {
        return;
      }
      if (skus.length > 0) {
        throw new OrderError('sku_required');
      }
    }),
  );
}
