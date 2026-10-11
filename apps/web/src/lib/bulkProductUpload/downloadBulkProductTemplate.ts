import * as XLSX from 'xlsx';
import {
  BULK_COLUMN_WIDTHS,
  BULK_DATA_SHEET_NAME,
  BULK_PRODUCT_HEADERS,
  BULK_SAMPLE_ROWS,
  BULK_TEMPLATE_FILENAME,
} from './columns';

function buildGuideSheet(): XLSX.WorkSheet {
  const lines: string[][] = [
    ['POP-UP CUBE 상품 일괄등록 양식 v1'],
    [''],
    ['1. 「상품일괄등록」 시트만 업로드됩니다.'],
    ['2. #예시 로 시작하는 판매자 상품코드 행은 업로드 시 자동으로 건너뜁니다. (삭제하고 입력해도 됩니다)'],
    ['3. 옵션이 없으면 재고수량 필수 · 옵션이 있으면 행마다 옵션 재고수량 · 같은 판매자 상품코드 = 한 상품'],
    ['4. 옵션명·옵션값: 칸 안에서 컬러|사이즈 처럼 | 로 구분 (스마트스토어 조합형과 동일)'],
    ['5. 대표이미지: https 로 시작하는 URL · 네이버 93열 파일 그대로는 올릴 수 없습니다'],
    [''],
    ['열', '필수', '설명'],
    ['판매자 상품코드', '권장', '매장 안에서 유일 · 엑셀 수정 시 같은 코드면 덮어씀'],
    ['상품명', 'O', ''],
    ['판매가', 'O', '원 · 숫자만'],
    ['재고수량', '옵션 없을 때 O', ''],
    ['옵션명 / 옵션값 / 옵션가 / 옵션 재고수량', '옵션 있을 때', '한 행 = 조합 1개'],
    ['대표이미지', 'O', 'URL'],
    ['주문 자동 수락', '', 'Y 또는 N'],
    ['자동 수락 건수', 'Y일 때', '1 이상'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(lines);
  ws['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 52 }];
  return ws;
}

function buildDataSheet(): XLSX.WorkSheet {
  const headerRow = [...BULK_PRODUCT_HEADERS];
  const sampleAoa = BULK_SAMPLE_ROWS.map((row) => BULK_PRODUCT_HEADERS.map((h) => row[h]));
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...sampleAoa]);
  ws['!cols'] = BULK_PRODUCT_HEADERS.map((h) => ({ wch: BULK_COLUMN_WIDTHS[h] }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
  return ws;
}

export function downloadBulkProductTemplate(): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildDataSheet(), BULK_DATA_SHEET_NAME);
  XLSX.utils.book_append_sheet(wb, buildGuideSheet(), '작성안내');
  XLSX.writeFile(wb, BULK_TEMPLATE_FILENAME);
}
