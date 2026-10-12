import ExcelJS from 'exceljs';
import {
  BULK_COLUMN_WIDTHS,
  BULK_DATA_SHEET_NAME,
  BULK_PRODUCT_HEADERS,
  BULK_SAMPLE_ROWS,
  BULK_TEMPLATE_FILENAME,
  type BulkProductHeader,
} from './columns';

const COL_COUNT = BULK_PRODUCT_HEADERS.length;
const LAST_COL = COL_COUNT;

const ARGB = {
  titleBg: 'FF1B5E20',
  titleFont: 'FFFFFFFF',
  noticeBg: 'FFFFF8E1',
  noticeFont: 'FF5D4037',
  headerBg: 'FF37474F',
  headerFont: 'FFFFFFFF',
  legendBg: 'FFF5F5F5',
  legendRequired: 'FFC62828',
  legendOptional: 'FF616161',
  hintBg: 'FFFAFAFA',
  hintFont: 'FF9E9E9E',
  sampleAlt: 'FFF1F8E9',
  border: 'FFBDBDBD',
  guideTitle: 'FF1565C0',
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: ARGB.border } },
  left: { style: 'thin', color: { argb: ARGB.border } },
  bottom: { style: 'thin', color: { argb: ARGB.border } },
  right: { style: 'thin', color: { argb: ARGB.border } },
};

/** 스마트스토어 「필수」 행과 동일 역할 */
const REQUIRED_HINTS: Record<BulkProductHeader, string> = {
  '판매자 상품코드': '권장',
  상품명: '필수',
  판매가: '필수',
  재고수량: '조건부',
  옵션명: '조건부',
  옵션값: '조건부',
  옵션가: '선택',
  '옵션 재고수량': '조건부',
  대표이미지: '필수',
  요약설명: '선택',
  상세설명: '선택',
  '주문 자동 수락': '선택',
  '자동 수락 건수': '조건부',
};

const INPUT_HINTS: Record<BulkProductHeader, string> = {
  '판매자 상품코드': '매장 내 유일 · 수정 시 덮어씀',
  상품명: '',
  판매가: '원 · 숫자',
  재고수량: '옵션 없을 때',
  옵션명: '컬러|사이즈',
  옵션값: '블랙|M',
  옵션가: '-5000 · 0',
  '옵션 재고수량': '옵션 있을 때',
  대표이미지: 'https://…',
  요약설명: '목록 짧은 글',
  상세설명: '상세 본문',
  '주문 자동 수락': 'Y / N',
  '자동 수락 건수': 'Y일 때 1↑',
};

function colLetter(n: number): string {
  let s = '';
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function styleLegendCell(cell: ExcelJS.Cell, label: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.legendBg } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.font = {
    size: 9,
    bold: label === '필수',
    color: { argb: label === '필수' ? ARGB.legendRequired : ARGB.legendOptional },
  };
  cell.border = THIN_BORDER;
}

function buildDataSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet(BULK_DATA_SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 5, activeCell: 'A6' }],
  });

  BULK_PRODUCT_HEADERS.forEach((h, i) => {
    const col = ws.getColumn(i + 1);
    col.width = BULK_COLUMN_WIDTHS[h];
    if (h === '판매가' || h === '옵션가' || h === '재고수량' || h === '옵션 재고수량' || h === '자동 수락 건수') {
      col.numFmt = '#,##0';
    }
  });

  ws.mergeCells(1, 1, 1, LAST_COL);
  const title = ws.getCell(1, 1);
  title.value = 'POP-UP CUBE  상품 일괄등록 양식  v1.1';
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.titleBg } };
  title.font = { bold: true, size: 14, color: { argb: ARGB.titleFont } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 34;

  ws.mergeCells(2, 1, 2, LAST_COL);
  const notice = ws.getCell(2, 1);
  notice.value =
    '※ 한 줄 = 손님이 고르는 옵션 조합 1개 (예: 블랙+M) · 옵션 2개 이상 = 옵션명「컬러|사이즈」·옵션값「블랙|M」 · #예시·5행 회색줄 제외 · 그림 = 「그림예시」·판매자센터「작성 매뉴얼」';
  notice.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.noticeBg } };
  notice.font = { size: 10, color: { argb: ARGB.noticeFont } };
  notice.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  ws.getRow(2).height = 40;

  const headerRow = ws.getRow(3);
  headerRow.height = 24;
  BULK_PRODUCT_HEADERS.forEach((h, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = h;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.headerBg } };
    c.font = { bold: true, size: 10, color: { argb: ARGB.headerFont } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = THIN_BORDER;
  });

  const legendRow = ws.getRow(4);
  legendRow.height = 20;
  BULK_PRODUCT_HEADERS.forEach((h, i) => {
    styleLegendCell(legendRow.getCell(i + 1), REQUIRED_HINTS[h]);
    legendRow.getCell(i + 1).value = REQUIRED_HINTS[h];
  });

  const hintRow = ws.getRow(5);
  hintRow.height = 28;
  BULK_PRODUCT_HEADERS.forEach((h, i) => {
    const c = hintRow.getCell(i + 1);
    c.value = INPUT_HINTS[h];
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.hintBg } };
    c.font = { size: 8, color: { argb: ARGB.hintFont } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = THIN_BORDER;
  });

  let dataStart = 6;
  BULK_SAMPLE_ROWS.forEach((sample, idx) => {
    const row = ws.getRow(dataStart + idx);
    row.height = 22;
    const alt = idx % 2 === 1;
    BULK_PRODUCT_HEADERS.forEach((h, i) => {
      const c = row.getCell(i + 1);
      c.value = sample[h];
      c.border = THIN_BORDER;
      c.alignment = { vertical: 'middle', wrapText: true };
      if (h === '판매가' || h === '옵션가') {
        c.numFmt = '#,##0';
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (h === '재고수량' || h === '옵션 재고수량' || h === '자동 수락 건수') {
        c.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (alt) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.sampleAlt } };
      }
    });
  });

  const lastDataRow = dataStart + BULK_SAMPLE_ROWS.length - 1;
  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: lastDataRow, column: LAST_COL },
  };

  const footRow = lastDataRow + 2;
  ws.mergeCells(footRow, 1, footRow, LAST_COL);
  const foot = ws.getCell(footRow, 1);
  foot.value = `(${colLetter(LAST_COL)}열 · 예시 ${BULK_SAMPLE_ROWS.length}행 — 등록 전 #예시 코드 행 삭제 또는 코드만 교체 · 입력은 6행부터)`;
  foot.font = { size: 9, italic: true, color: { argb: ARGB.hintFont } };
  foot.alignment = { horizontal: 'left', vertical: 'middle' };
}

function paintBlock(
  ws: ExcelJS.Worksheet,
  r: number,
  c1: number,
  c2: number,
  fill: string,
  text: string,
  fontColor = 'FF191F28',
  bold = false,
) {
  for (let c = c1; c <= c2; c += 1) {
    const cell = ws.getCell(r, c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', wrapText: true };
  }
  ws.mergeCells(r, c1, r, c2);
  const head = ws.getCell(r, c1);
  head.value = text;
  head.font = { bold, size: 11, color: { argb: fontColor } };
}

function buildPictureExampleSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('그림예시', { views: [{ showGridLines: true }] });
  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 10;
  ws.getColumn(7).width = 22;

  paintBlock(ws, 1, 1, 7, ARGB.titleBg, '옵션 적는 법 — 그림으로', ARGB.titleFont, true);
  ws.getRow(1).height = 28;

  paintBlock(ws, 3, 1, 7, 'FFFFEBEE', '❌ 이렇게 하면 안 됨 — 행마다 「컬러」「사이즈」만 나누기', 'FFC62828', true);
  const badHeader = ws.getRow(4);
  ['코드', '옵션명', '옵션값', '결과'].forEach((h, i) => {
    const c = badHeader.getCell(i + 1);
    c.value = h;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.headerBg } };
    c.font = { bold: true, color: { argb: ARGB.headerFont } };
    c.border = THIN_BORDER;
  });
  badHeader.getCell(5).value = '';
  ws.getCell(5, 1).value = 'TEST-01';
  ws.getCell(5, 2).value = '컬러';
  ws.getCell(5, 3).value = '블랙';
  ws.getCell(5, 4).value = '「컬러만」 SKU (X)';
  ws.getCell(6, 1).value = 'TEST-01';
  ws.getCell(6, 2).value = '사이즈';
  ws.getCell(6, 3).value = 'M';
  ws.getCell(6, 4).value = '「사이즈만」 SKU (X)';
  [5, 6].forEach((r) => {
    for (let c = 1; c <= 4; c += 1) {
      ws.getCell(r, c).border = THIN_BORDER;
    }
  });

  paintBlock(ws, 8, 1, 7, 'FFE8F5E9', '✅ 이렇게 — 옵션명·옵션값 한 칸에 | 로 묶기', 'FF2E7D32', true);
  const goodHeader = ws.getRow(9);
  ['코드', '옵션명', '옵션값', '손님 화면'].forEach((h, i) => {
    const c = goodHeader.getCell(i + 1);
    c.value = h;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.headerBg } };
    c.font = { bold: true, color: { argb: ARGB.headerFont } };
    c.border = THIN_BORDER;
  });
  const goodRows: string[][] = [
    ['SCARF-01', '컬러|사이즈', '블랙|M', '블랙 / M'],
    ['SCARF-01', '컬러|사이즈', '화이트|L', '화이트 / L'],
    ['(비워도 됨)', '컬러|사이즈', '블랙|L', '블랙 / L'],
  ];
  goodRows.forEach((line, idx) => {
    const r = 10 + idx;
    line.forEach((val, j) => {
      const c = ws.getCell(r, j + 1);
      c.value = val;
      c.border = THIN_BORDER;
      if (idx === 2 && j === 0) c.font = { color: { argb: ARGB.hintFont } };
    });
  });

  paintBlock(
    ws,
    14,
    1,
    7,
    ARGB.noticeBg,
    '같은 상품코드 — 첫 줄에만 상품명·판매가·대표이미지(https) · 6행부터 입력 · PC「작성 매뉴얼」',
    ARGB.noticeFont,
    false,
  );
}

function buildGuideSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('작성안내', { views: [{ showGridLines: true }] });
  ws.getColumn(1).width = 20;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 58;

  const rows: Array<[string, string, string]> = [
    ['POP-UP CUBE 상품 일괄등록 — 작성 안내', '', ''],
    ['', '', ''],
    ['항목', '구분', '설명'],
    ['판매자 상품코드', '권장', '매장 안에서 유일. 엑셀 재업로드 시 같은 코드면 상품·옵션 덮어씀'],
    ['상품명 / 판매가 / 대표이미지', '필수', '목록·상세에 노출되는 기본 정보'],
    ['재고수량', '옵션 없을 때 필수', '옵션이 있으면 칸 비움 → 옵션 재고수량 사용'],
    ['옵션명·옵션값·옵션가·옵션 재고', '옵션 있을 때', '한 행 = 조합 1개. 같은 상품코드로 행 추가'],
    ['옵션명·값 구분', '', '셀 안에서 컬러|사이즈 · 값은 블랙|M (| 구분)'],
    ['옵션 여러 개', '조합형', '컬러·사이즈를 **행 두 개로 나누지 않음**. 블랙·M / 화이트·L = **행 2개** · 각 행에 옵션명·값 **전부**'],
    ['아래 줄 이어쓰기', '', '같은 판매자 상품코드면 상품명·판매가·대표이미지 **비워도** 윗줄 값 사용'],
    ['주문 자동 수락', '선택', 'Y 또는 N · Y면 자동 수락 건수 1 이상'],
    ['', '', ''],
    ['업로드', '', '판매자센터 → 상품 → 엑셀 일괄 등록 → 「상품일괄등록」 시트 기준'],
  ];

  rows.forEach((line, i) => {
    const r = i + 1;
    if (r === 1) {
      ws.mergeCells(1, 1, 1, 3);
    }
    line.forEach((text, j) => {
      const c = ws.getCell(r, j + 1);
      c.value = text;
      if (r === 1) {
        c.font = { bold: true, size: 13, color: { argb: ARGB.guideTitle } };
      } else if (r === 3) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ARGB.headerBg } };
        c.font = { bold: true, color: { argb: ARGB.headerFont } };
        c.border = THIN_BORDER;
      } else if (r > 3 && text) {
        c.border = THIN_BORDER;
        c.alignment = { wrapText: true, vertical: 'top' };
        if (j === 1 && text === '필수') {
          c.font = { color: { argb: ARGB.legendRequired }, bold: true };
        }
      }
    });
  });
}

let templateBufferPromise: Promise<ArrayBuffer> | null = null;

async function buildTemplateBuffer(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'POP-UP CUBE';
  wb.created = new Date();
  buildDataSheet(wb);
  buildPictureExampleSheet(wb);
  buildGuideSheet(wb);
  const raw = await wb.xlsx.writeBuffer();
  if (raw instanceof ArrayBuffer) return raw;
  return new Uint8Array(raw as ArrayLike<number>).buffer;
}

/** 패널 열릴 때 미리 생성 — 첫 다운로드 대기 줄임 */
export function preloadBulkProductTemplate(): void {
  if (!templateBufferPromise) {
    templateBufferPromise = buildTemplateBuffer().catch((err) => {
      templateBufferPromise = null;
      throw err;
    });
  }
}

export function resetBulkProductTemplateCache(): void {
  templateBufferPromise = null;
}

export async function downloadStyledBulkProductTemplate(): Promise<void> {
  if (!templateBufferPromise) templateBufferPromise = buildTemplateBuffer();
  const buffer = await templateBufferPromise;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BULK_TEMPLATE_FILENAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
