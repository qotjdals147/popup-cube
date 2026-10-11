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

export const BULK_TEMPLATE_FILENAME = 'POPUP-CUBE_상품일괄등록양식_v1.xlsx';

export const BULK_DATA_SHEET_NAME = '상품일괄등록';

/** 업로드 시 무시 (#예시 = 양식 안내용) */
export const BULK_SAMPLE_CODE_PREFIX = '#예시';

export const BULK_COLUMN_WIDTHS: Record<BulkProductHeader, number> = {
  '판매자 상품코드': 18,
  상품명: 22,
  판매가: 10,
  재고수량: 10,
  옵션명: 14,
  옵션값: 16,
  옵션가: 10,
  '옵션 재고수량': 12,
  대표이미지: 42,
  요약설명: 24,
  상세설명: 28,
  '주문 자동 수락': 12,
  '자동 수락 건수': 12,
};

type SampleRow = Record<BulkProductHeader, string | number>;

/** 무옵션 1종 + 옵션 2행(같은 상품코드) */
export const BULK_SAMPLE_ROWS: SampleRow[] = [
  {
    '판매자 상품코드': `${BULK_SAMPLE_CODE_PREFIX}-TEE-01`,
    상품명: '예시) 기본 티셔츠',
    판매가: 29000,
    재고수량: 30,
    옵션명: '',
    옵션값: '',
    옵션가: '',
    '옵션 재고수량': '',
    대표이미지: 'https://popup-cube-web.vercel.app/favicon.ico',
    요약설명: '목록용 한 줄 설명',
    상세설명: '상세 페이지 본문',
    '주문 자동 수락': 'N',
    '자동 수락 건수': 0,
  },
  {
    '판매자 상품코드': `${BULK_SAMPLE_CODE_PREFIX}-SCARF-01`,
    상품명: '예시) 실크 스카프',
    판매가: 89000,
    재고수량: '',
    옵션명: '컬러|사이즈',
    옵션값: '블랙|M',
    옵션가: 0,
    '옵션 재고수량': 10,
    대표이미지: 'https://popup-cube-web.vercel.app/favicon.ico',
    요약설명: '옵션 있으면 행을 더 추가',
    상세설명: '같은 판매자 상품코드 = 한 상품',
    '주문 자동 수락': 'Y',
    '자동 수락 건수': 20,
  },
  {
    '판매자 상품코드': `${BULK_SAMPLE_CODE_PREFIX}-SCARF-01`,
    상품명: '예시) 실크 스카프',
    판매가: 89000,
    재고수량: '',
    옵션명: '컬러|사이즈',
    옵션값: '화이트|L',
    옵션가: -5000,
    '옵션 재고수량': 5,
    대표이미지: 'https://popup-cube-web.vercel.app/favicon.ico',
    요약설명: '옵션 있으면 행을 더 추가',
    상세설명: '같은 판매자 상품코드 = 한 상품',
    '주문 자동 수락': 'Y',
    '자동 수락 건수': 20,
  },
];
