import { MAX_PRODUCT_OPTION_GROUPS, type ProductSku, type ProductSkuOptionValue } from '@popup-cube/shared';
import { supabase } from './supabase';

/** AD-090 — 표 한 행. `values[i]` 는 `groupNames[i]` 옵션의 값. */
export interface OwnerSkuRow {
  values: string[];
  /** 옵션 칸별 ±(원). 있으면 저장 시 `price_delta` = 합 */
  adjustments: number[];
  stock_quantity: number;
  price_delta: number;
}

export const DEFAULT_OPTION_GROUP_NAMES = ['컬러', '사이즈'];

export function normalizeOptionValues(raw: unknown): ProductSkuOptionValue[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((el) => {
      const o = (el ?? {}) as { name?: unknown; value?: unknown; adjustment?: unknown };
      const adjRaw = o.adjustment;
      const adjustment =
        typeof adjRaw === 'number' && Number.isFinite(adjRaw)
          ? Math.trunc(adjRaw)
          : typeof adjRaw === 'string' && /^-?\d+$/.test(adjRaw.trim())
            ? parseInt(adjRaw.trim(), 10)
            : undefined;
      return {
        name: String(o.name ?? '').trim(),
        value: String(o.value ?? '').trim(),
        ...(adjustment !== undefined && adjustment !== 0 ? { adjustment } : {}),
      };
    })
    .filter((o) => o.value.length > 0)
    .slice(0, MAX_PRODUCT_OPTION_GROUPS);
}

function normalizeSku(raw: ProductSku): ProductSku {
  return { ...raw, option_values: normalizeOptionValues(raw.option_values) };
}

/** 같은 상품의 SKU 는 같은 옵션명·같은 순서를 가진다 → 가장 많은 옵션을 가진 행에서 유도. */
export function deriveOptionGroupNames(skus: ProductSku[]): string[] {
  let best: ProductSkuOptionValue[] = [];
  for (const sku of skus) {
    if (sku.option_values.length > best.length) best = sku.option_values;
  }
  return best.map((o, i) => o.name || `옵션 ${i + 1}`);
}

export async function getProductSkus(productId: string): Promise<ProductSku[]> {
  const { data, error } = await supabase.rpc('get_product_skus', { p_product_id: productId });
  if (error) throw error;
  return ((data ?? []) as ProductSku[]).map(normalizeSku);
}

export async function getOwnerProductSkus(productId: string): Promise<ProductSku[]> {
  const { data, error } = await supabase.rpc('get_owner_product_skus', { p_product_id: productId });
  if (error) throw error;
  return ((data ?? []) as ProductSku[]).map(normalizeSku);
}

export async function saveOwnerProductSkus(
  productId: string,
  groupNames: string[],
  rows: OwnerSkuRow[]
): Promise<void> {
  const names = groupNames.slice(0, MAX_PRODUCT_OPTION_GROUPS);
  const payload: Array<{
    option_values: ProductSkuOptionValue[];
    stock_quantity: number;
    price_delta: number;
    sort_order: number;
    is_active: boolean;
  }> = [];

  rows.forEach((row) => {
    const option_values = names
      .map((name, i) => {
        const value = (row.values[i] ?? '').trim();
        if (!value) return null;
        const adj = row.adjustments?.[i] ?? 0;
        const base = { name: name.trim() || `옵션 ${i + 1}`, value };
        return adj !== 0 ? { ...base, adjustment: adj } : base;
      })
      .filter((o): o is ProductSkuOptionValue => o !== null && o.value.length > 0);
    if (option_values.length === 0) return;
    const adjSum = (row.adjustments ?? []).reduce((s, a) => s + (a ?? 0), 0);
    const price_delta = adjSum !== 0 ? adjSum : row.price_delta ?? 0;
    payload.push({
      option_values,
      stock_quantity: row.stock_quantity,
      price_delta,
      sort_order: payload.length,
      is_active: true,
    });
  });

  const { error } = await supabase.rpc('save_owner_product_skus', {
    p_product_id: productId,
    p_rows: payload,
  });
  if (error) throw error;
}
