/** §7.96 POP-UP CUBE 일괄등록 v1 — 열 이름 = 스마트스토어 호환 서브셋 */
export const BULK_PRODUCT_HEADERS = [
  '판매자 상품코드',
  '상품명',
  '판매가',
  '재고수량',
  '옵션명',
  '옵션값',
  '옵션가',
  '옵션 재고수량',
  '대표이미지',
  '요약설명',
  '상세설명',
  '주문 자동 수락',
  '자동 수락 건수',
] as const;

export type BulkProductHeader = (typeof BULK_PRODUCT_HEADERS)[number];

export const BULK_TEMPLATE_FILENAME = 'popup-cube-product-upload-v1.xlsx';

/** 샘플 1행 — 옵션 2줄(컬러/사이즈)은 「한 행 = SKU 1개」 예시 */
export const BULK_SAMPLE_ROW: Record<BulkProductHeader, string | number> = {
  '판매자 상품코드': 'DEMO-SCARF-01',
  상품명: '데모 실크 스카프',
  판매가: 89000,
  재고수량: '',
  옵션명: '컬러|사이즈',
  옵션값: '블랙|M',
  옵션가: 0,
  '옵션 재고수량': 10,
  대표이미지: 'https://example.com/scarf-main.jpg',
  요약설명: '목록에 보이는 짧은 설명',
  상세설명: '상세 페이지 본문',
  '주문 자동 수락': 'N',
  '자동 수락 건수': 0,
};
