import * as XLSX from 'xlsx';
import { MAX_PRODUCT_OPTION_GROUPS } from '@popup-cube/shared';
import { BULK_PRODUCT_HEADERS, type BulkProductHeader } from './columns';

export interface BulkRowError {
  row: number;
  message: string;
}

export interface ParsedBulkSkuLine {
  excelRow: number;
  optionNames: string[];
  optionValues: string[];
  priceDelta: number;
  skuStock: number;
}

export interface ParsedBulkProductGroup {
  key: string;
  productCode: string | null;
  name: string;
  price: number;
  productStock: number | null;
  imageUrl: string;
  summary: string;
  detail: string;
  autoAcceptEnabled: boolean;
  autoAcceptLimit: number;
  skuLines: ParsedBulkSkuLine[];
  sourceRows: number[];
}

export interface ParseBulkProductResult {
  groups: ParsedBulkProductGroup[];
  errors: BulkRowError[];
}

function normHeader(h: unknown): string {
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

function mapHeaders(row: unknown[]): Map<BulkProductHeader, number> | null {
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

function cell(row: unknown[], col: Map<BulkProductHeader, number>, h: BulkProductHeader): string {
  const i = col.get(h)!;
  const v = row[i];
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function parseIntCell(raw: string, allowEmpty = false): number | null {
  const s = raw.replace(/,/g, '').trim();
  if (!s) return allowEmpty ? null : NaN;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : NaN;
}

function parseSignedInt(raw: string): number {
  const s = raw.replace(/,/g, '').replace(/\u2212/g, '-').trim();
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : NaN;
}

function splitGroups(cell: string): string[] {
  const raw = cell.trim();
  if (!raw) return [];
  const parts = raw.includes('\n')
    ? raw.split(/\n/)
    : raw.includes('|')
      ? raw.split('|')
      : [raw];
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseBool(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (!s) return false;
  return s === 'y' || s === 'yes' || s === '1' || s === 'true' || s === '예' || s === 'on';
}

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function groupKey(code: string | null, name: string): string {
  const c = code?.trim().toLowerCase();
  if (c) return `code:${c}`;
  return `name:${name.trim().toLowerCase()}`;
}

export function parseBulkProductXlsx(buffer: ArrayBuffer): ParseBulkProductResult {
  const errors: BulkRowError[] = [];
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0] ?? ''];
  if (!sheet) {
    return { groups: [], errors: [{ row: 0, message: '시트를 찾을 수 없어요.' }] };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  if (rows.length < 2) {
    return { groups: [], errors: [{ row: 0, message: '데이터 행이 없어요. (헤더 + 최소 1행)' }] };
  }

  const col = mapHeaders(rows[0] ?? []);
  if (!col) {
    return {
      groups: [],
      errors: [{ row: 1, message: '첫 줄 헤더가 우리 양식과 다릅니다. 「양식 다운로드」 파일을 쓰세요.' }],
    };
  }

  const draft = new Map<string, ParsedBulkProductGroup>();

  for (let r = 1; r < rows.length; r += 1) {
    const excelRow = r + 1;
    const row = rows[r] ?? [];
    if (row.every((c) => !String(c ?? '').trim())) continue;

    const name = cell(row, col, '상품명');
    const codeRaw = cell(row, col, '판매자 상품코드');
    const productCode = codeRaw ? codeRaw.slice(0, 40) : null;

    if (!name) {
      errors.push({ row: excelRow, message: '상품명이 비어 있어요.' });
      continue;
    }

    const price = parseIntCell(cell(row, col, '판매가'));
    if (price === null || !Number.isFinite(price) || price < 0) {
      errors.push({ row: excelRow, message: '판매가를 확인해 주세요.' });
      continue;
    }

    const imageUrl = cell(row, col, '대표이미지');
    if (!isHttpUrl(imageUrl)) {
      errors.push({ row: excelRow, message: '대표이미지는 http(s) URL이어야 해요.' });
      continue;
    }

    const optionNames = splitGroups(cell(row, col, '옵션명')).slice(0, MAX_PRODUCT_OPTION_GROUPS);
    const optionValues = splitGroups(cell(row, col, '옵션값')).slice(0, MAX_PRODUCT_OPTION_GROUPS);
    const hasOptions = optionNames.length > 0 || optionValues.length > 0;

    let productStock: number | null = parseIntCell(cell(row, col, '재고수량'), true);
    let priceDelta = 0;
    let skuStock = 0;

    if (hasOptions) {
      if (optionNames.length === 0 || optionValues.length === 0) {
        errors.push({ row: excelRow, message: '옵션명·옵션값을 같이 넣어 주세요.' });
        continue;
      }
      if (optionNames.length !== optionValues.length) {
        errors.push({ row: excelRow, message: '옵션명 개수와 옵션값 개수가 맞지 않아요.' });
        continue;
      }
      if (optionNames.length > MAX_PRODUCT_OPTION_GROUPS) {
        errors.push({ row: excelRow, message: `옵션명은 최대 ${MAX_PRODUCT_OPTION_GROUPS}개까지예요.` });
        continue;
      }
      priceDelta = parseSignedInt(cell(row, col, '옵션가'));
      if (!Number.isFinite(priceDelta)) {
        errors.push({ row: excelRow, message: '옵션가를 확인해 주세요.' });
        continue;
      }
      const sk = parseIntCell(cell(row, col, '옵션 재고수량'));
      if (sk === null || !Number.isFinite(sk) || sk < 0) {
        errors.push({ row: excelRow, message: '옵션 재고수량을 확인해 주세요.' });
        continue;
      }
      skuStock = sk;
      productStock = null;
    } else {
      if (productStock === null || !Number.isFinite(productStock) || productStock < 0) {
        errors.push({ row: excelRow, message: '옵션이 없으면 재고수량이 필요해요.' });
        continue;
      }
    }

    const autoAcceptEnabled = parseBool(cell(row, col, '주문 자동 수락'));
    const autoLimitRaw = parseIntCell(cell(row, col, '자동 수락 건수'), true);
    const autoAcceptLimit =
      autoLimitRaw !== null && Number.isFinite(autoLimitRaw) ? Math.max(0, autoLimitRaw) : 0;
    if (autoAcceptEnabled && autoAcceptLimit <= 0) {
      errors.push({ row: excelRow, message: '자동 수락 Y면 자동 수락 건수를 1 이상 넣어 주세요.' });
      continue;
    }

    const summary = cell(row, col, '요약설명');
    const detail = cell(row, col, '상세설명');
    const key = groupKey(productCode, name);

    const skuLine: ParsedBulkSkuLine | null = hasOptions
      ? { excelRow, optionNames, optionValues, priceDelta, skuStock }
      : null;

    const existing = draft.get(key);
    if (!existing) {
      draft.set(key, {
        key,
        productCode,
        name: name.slice(0, 120),
        price,
        productStock,
        imageUrl,
        summary: summary.slice(0, 300),
        detail,
        autoAcceptEnabled,
        autoAcceptLimit,
        skuLines: skuLine ? [skuLine] : [],
        sourceRows: [excelRow],
      });
      continue;
    }

    if (existing.name !== name.slice(0, 120) || existing.price !== price) {
      errors.push({ row: excelRow, message: '같은 상품코드(또는 상품명)인데 판매가·이름이 달라요.' });
      continue;
    }
    if (existing.imageUrl !== imageUrl) {
      errors.push({ row: excelRow, message: '같은 상품인데 대표이미지 URL이 달라요.' });
      continue;
    }

    if (skuLine) {
      const namesKey = skuLine.optionNames.join('\0');
      const refNames = existing.skuLines[0]?.optionNames.join('\0') ?? namesKey;
      if (existing.skuLines.length > 0 && refNames !== namesKey) {
        errors.push({ row: excelRow, message: '같은 상품인데 옵션명 구성이 달라요.' });
        continue;
      }
      existing.skuLines.push(skuLine);
    } else if (existing.skuLines.length > 0) {
      errors.push({ row: excelRow, message: '같은 상품에 옵션 행과 무옵션 행이 섞여 있어요.' });
      continue;
    }

    existing.sourceRows.push(excelRow);
  }

  return { groups: [...draft.values()], errors };
}
