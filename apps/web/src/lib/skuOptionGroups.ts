import type { ProductSku } from '@popup-cube/shared';
import { formatPriceDeltaLabel } from './skuPrice';

/** AD-090 — 손님 화면에서 옵션명별로 고르게 하기 위한 그룹 정보 */
export interface SkuOptionGroup {
  name: string;
  values: string[];
}

function valueAt(sku: ProductSku, groupIdx: number): string {
  return sku.option_values[groupIdx]?.value ?? '';
}

function adjustmentAt(sku: ProductSku, groupIdx: number): number {
  return sku.option_values[groupIdx]?.adjustment ?? 0;
}

/** 같은 상품의 SKU 는 같은 옵션명·같은 순서를 가진다. 값 순서는 SKU 등록 순서를 따른다. */
export function buildSkuOptionGroups(skus: ProductSku[]): SkuOptionGroup[] {
  const groupCount = skus.reduce((n, s) => Math.max(n, s.option_values.length), 0);
  const groups: SkuOptionGroup[] = [];
  for (let i = 0; i < groupCount; i += 1) {
    const name = skus.find((s) => s.option_values[i]?.name)?.option_values[i]?.name ?? `옵션 ${i + 1}`;
    const seen = new Set<string>();
    const values: string[] = [];
    for (const sku of skus) {
      const v = valueAt(sku, i);
      if (!v || seen.has(v)) continue;
      seen.add(v);
      values.push(v);
    }
    groups.push({ name, values });
  }
  return groups;
}

/** `ignoreIdx` 를 뺀 나머지 선택과 일치하는 SKU들. 아직 안 고른 칸은 조건에서 제외. */
export function matchingSkus(
  skus: ProductSku[],
  selection: string[],
  ignoreIdx: number | null = null
): ProductSku[] {
  return skus.filter((sku) =>
    selection.every((chosen, i) => {
      if (i === ignoreIdx || !chosen) return true;
      return valueAt(sku, i) === chosen;
    })
  );
}

/** 완전히 고른 상태일 때만 SKU 하나로 확정된다. */
export function findSkuBySelection(
  skus: ProductSku[],
  groups: SkuOptionGroup[],
  selection: string[]
): ProductSku | null {
  if (groups.length === 0) return null;
  if (groups.some((_, i) => !selection[i])) return null;
  return skus.find((sku) => groups.every((_, i) => valueAt(sku, i) === selection[i])) ?? null;
}

/** 다른 칸 선택과 조합이 되는 값만 고를 수 있게 한다. */
export function optionValueState(
  skus: ProductSku[],
  selection: string[],
  groupIdx: number,
  value: string
): { exists: boolean; inStock: boolean; onlySku: ProductSku | null } {
  const candidates = matchingSkus(skus, selection, groupIdx).filter(
    (sku) => valueAt(sku, groupIdx) === value
  );
  return {
    exists: candidates.length > 0,
    inStock: candidates.some((sku) => sku.stock_quantity > 0),
    onlySku: candidates.length === 1 ? candidates[0] : null,
  };
}

/** 앞 칸을 바꾸면 뒤 칸 선택이 불가능한 조합이 될 수 있다 → 불가능해진 칸만 비운다. */
export function pruneSelection(
  skus: ProductSku[],
  groups: SkuOptionGroup[],
  selection: string[]
): string[] {
  const next = groups.map((_, i) => selection[i] ?? '');
  for (let i = 0; i < next.length; i += 1) {
    if (!next[i]) continue;
    const probe = next.map((v, j) => (j > i ? '' : v));
    if (matchingSkus(skus, probe).length === 0) next[i] = '';
  }
  return next;
}

function canonicalSkuDelta(
  skus: ProductSku[],
  selection: string[],
  groupIdx: number,
  value: string
): number | null {
  const candidates = matchingSkus(skus, selection, groupIdx).filter(
    (sku) => valueAt(sku, groupIdx) === value
  );
  if (candidates.length === 0) return null;
  const deltas = new Set(candidates.map((s) => s.price_delta ?? 0));
  if (deltas.size !== 1) return null;
  return [...deltas][0]!;
}

/** jsonb `adjustment` — 점주가 칸별로 ± 넣었을 때 */
function canonicalCellAdjustment(
  skus: ProductSku[],
  selection: string[],
  groupIdx: number,
  value: string
): number | null {
  const candidates = matchingSkus(skus, selection, groupIdx).filter(
    (sku) => valueAt(sku, groupIdx) === value
  );
  if (candidates.length === 0) return null;
  const adjs = candidates.map((s) => adjustmentAt(s, groupIdx));
  const unique = new Set(adjs);
  if (unique.size !== 1) return null;
  const a = [...unique][0]!;
  return a === 0 ? null : a;
}

/** 가격이 **이 옵션 칸에서** 갈리는지 (형제 값들끼리 delta 스프레드) */
function primaryPriceGroupIndex(
  skus: ProductSku[],
  selection: string[],
  groups: SkuOptionGroup[]
): number | null {
  let bestGi: number | null = null;
  let bestSpread = 0;
  for (let gi = 0; gi < groups.length; gi += 1) {
    if (groups[gi].values.length < 2) continue;
    const nums = groups[gi].values
      .map((v) => canonicalSkuDelta(skus, selection, gi, v))
      .filter((d): d is number => d !== null);
    if (nums.length < 2) continue;
    const spread = Math.max(...nums) - Math.min(...nums);
    if (spread > bestSpread) {
      bestSpread = spread;
      bestGi = gi;
    }
  }
  if (bestSpread > 0) return bestGi;
  for (let gi = 0; gi < groups.length; gi += 1) {
    if (groups[gi].values.length < 2) continue;
    const nums = groups[gi].values
      .map((v) => canonicalSkuDelta(skus, selection, gi, v))
      .filter((d): d is number => d !== null);
    if (nums.some((d) => d !== 0) && nums.some((d) => d === 0)) return gi;
  }
  return null;
}

/**
 * 손님 드롭다운 옵션값 옆 ± — **중복 없이** “이 칸에서 고르면 이만큼”
 * 1) 칸별 adjustment (점주 입력) 우선
 * 2) 없으면 SKU price_delta — **가격이 갈리는 옵션 칸**에만
 */
export function optionValuePriceSuffix(
  skus: ProductSku[],
  selection: string[],
  groups: SkuOptionGroup[],
  groupIdx: number,
  value: string,
  formatPrice: (n: number) => string
): string {
  const cellAdj = canonicalCellAdjustment(skus, selection, groupIdx, value);
  if (cellAdj !== null) return formatPriceDeltaLabel(cellAdj, formatPrice);

  const primaryGi = primaryPriceGroupIndex(skus, selection, groups);
  if (primaryGi !== groupIdx) return '';

  const d = canonicalSkuDelta(skus, selection, groupIdx, value);
  if (d === null || d === 0) return '';

  const siblings = groups[groupIdx].values
    .map((v) => canonicalSkuDelta(skus, selection, groupIdx, v))
    .filter((x): x is number => x !== null);
  if (siblings.length < 2) return formatPriceDeltaLabel(d, formatPrice);

  const minD = Math.min(...siblings);
  const maxD = Math.max(...siblings);
  if (minD === maxD) {
    if (groups[groupIdx].values.length < 2) return '';
    const laterSingle = groups.slice(groupIdx + 1).every((g) => g.values.length <= 1);
    if (groupIdx === 0 || laterSingle) return formatPriceDeltaLabel(d, formatPrice);
    return '';
  }
  if (d !== 0) return formatPriceDeltaLabel(d, formatPrice);
  return '';
}
