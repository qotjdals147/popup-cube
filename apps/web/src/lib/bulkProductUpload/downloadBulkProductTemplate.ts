import * as XLSX from 'xlsx';
import { BULK_PRODUCT_HEADERS, BULK_SAMPLE_ROW, BULK_TEMPLATE_FILENAME } from './columns';

export function downloadBulkProductTemplate(): void {
  const headerRow = [...BULK_PRODUCT_HEADERS];
  const sampleRow = BULK_PRODUCT_HEADERS.map((h) => BULK_SAMPLE_ROW[h]);
  const ws = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
  ws['!cols'] = headerRow.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '상품일괄등록');
  XLSX.writeFile(wb, BULK_TEMPLATE_FILENAME);
}
