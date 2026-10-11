import type { Product } from '@popup-cube/shared';
import {
  createProduct,
  ProductError,
  updateProduct,
  updateProductDetailDescription,
  updateProductFulfillment,
} from '../products';
import { saveOwnerProductSkus, type OwnerSkuRow } from '../productSkus';
import type { BulkRowError, ParsedBulkProductGroup } from './parseBulkProductXlsx';

export interface BulkImportRowError extends BulkRowError {
  productLabel: string;
}

export interface BulkImportResult {
  created: number;
  updated: number;
  errors: BulkImportRowError[];
}

function findByCode(products: Product[], code: string | null): Product | null {
  if (!code) return null;
  const k = code.trim().toLowerCase();
  return products.find((p) => (p.product_code ?? '').trim().toLowerCase() === k) ?? null;
}

function negativeSale(basePrice: number, delta: number): boolean {
  return basePrice + delta < 0;
}

export async function importBulkProductGroups(
  userId: string,
  storeId: string,
  groups: ParsedBulkProductGroup[],
  existingProducts: Product[]
): Promise<BulkImportResult> {
  const errors: BulkImportRowError[] = [];
  let created = 0;
  let updated = 0;

  for (const g of groups) {
    const label = g.productCode ?? g.name;
    try {
      const skuRows: OwnerSkuRow[] = g.skuLines.map((line) => ({
        values: line.optionValues,
        adjustments: line.optionNames.map(() => 0),
        stock_quantity: line.skuStock,
        price_delta: line.priceDelta,
      }));

      for (const line of g.skuLines) {
        if (negativeSale(g.price, line.priceDelta)) {
          errors.push({
            row: line.excelRow,
            productLabel: label,
            message: '옵션 적용 판매가가 0원 미만이에요.',
          });
          throw new Error('validation');
        }
      }

      const stockQty =
        g.skuLines.length > 0
          ? g.skuLines.reduce((s, l) => s + l.skuStock, 0)
          : g.productStock ?? 0;

      const matched = findByCode(existingProducts, g.productCode);
      let productId: string;

      if (matched) {
        productId = matched.id;
        await updateProduct(userId, productId, {
          productCode: g.productCode ?? '',
          name: g.name,
          description: g.summary,
          price: g.price,
          imageUrl: g.imageUrl,
        });
        updated += 1;
      } else {
        const createdProduct = await createProduct(userId, {
          storeId,
          productCode: g.productCode ?? '',
          name: g.name,
          description: g.summary,
          price: g.price,
          imageFile: null,
          imageUrl: g.imageUrl,
        });
        productId = createdProduct.id;
        existingProducts.push(createdProduct);
        created += 1;
      }

      await updateProductDetailDescription(productId, g.detail);
      await updateProductFulfillment(productId, {
        stockQuantity: stockQty,
        autoAcceptEnabled: g.autoAcceptEnabled,
        autoAcceptLimit: g.autoAcceptEnabled ? g.autoAcceptLimit : 0,
      });

      if (skuRows.length > 0) {
        const groupNames = g.skuLines[0]!.optionNames;
        await saveOwnerProductSkus(productId, groupNames, skuRows);
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'validation') continue;
      if (e instanceof ProductError && e.code === 'DUPLICATE_PRODUCT_CODE') {
        errors.push({
          row: g.sourceRows[0] ?? 0,
          productLabel: label,
          message: '이 매장에 같은 판매자 상품코드가 이미 있어요.',
        });
        continue;
      }
      errors.push({
        row: g.sourceRows[0] ?? 0,
        productLabel: label,
        message: e instanceof Error ? e.message : '저장하지 못했어요.',
      });
    }
  }

  return { created, updated, errors };
}
