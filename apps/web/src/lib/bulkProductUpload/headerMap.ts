import { BULK_PRODUCT_HEADERS, type BulkProductHeader } from './columns';

export function normHeader(h: unknown): string {
  return String(h ?? '')
    .replace(/\s+/g, '')
    .trim();
}

const HEADER_ALIASES: Record<string, BulkProductHeader> = {
  판매자상품코드: '판매자 상품코드',
  상품명: '상품명',
  판매가: '판매가',
  재고수량: '재고수량',
  옵션명: '옵션명',
  옵션값: '옵션값',
  옵션가: '옵션가',
  '옵션재고수량': '옵션 재고수량',
  대표이미지: '대표이미지',
  요약설명: '요약설명',
  상세설명: '상세설명',
  '주문자동수락': '주문 자동 수락',
  '자동수락건수': '자동 수락 건수',
};

export function mapHeaders(row: unknown[]): Map<BulkProductHeader, number> | null {
  const idx = new Map<BulkProductHeader, number>();
  row.forEach((cell, i) => {
    const key = normHeader(cell);
    const mapped = HEADER_ALIASES[key];
    if (mapped) idx.set(mapped, i);
  });
  for (const h of BULK_PRODUCT_HEADERS) {
    if (!idx.has(h)) return null;
  }
  return idx;
}

/** 스마트스토어형 — 헤더가 1~20행 중 어디에 있든 찾기 */
export function findHeaderRowIndex(rows: unknown[][]): number {
  const limit = Math.min(rows.length, 25);
  for (let r = 0; r < limit; r += 1) {
    if (mapHeaders(rows[r] ?? [])) return r;
  }
  return -1;
}

const LEGEND = /^(필수|선택|조건부|권장|o|x|○|－|-)$/i;

/** 「필수 / 선택」 안내 행 — 업로드 제외 */
export function isLegendRow(row: unknown[], col: Map<BulkProductHeader, number>): boolean {
  const vals = BULK_PRODUCT_HEADERS.map((h) => cellAt(row, col, h)).filter(Boolean);
  if (vals.length === 0) return true;
  if (vals.every((v) => LEGEND.test(v))) return true;
  const joined = vals.join('');
  if (joined.includes('입력') && joined.includes('예')) return true;
  return false;
}

export function cellAt(row: unknown[], col: Map<BulkProductHeader, number>, h: BulkProductHeader): string {
  const i = col.get(h)!;
  const v = row[i];
  if (v === null || v === undefined) return '';
  return String(v).trim();
}
