/** 점주 상품 수정 — 구역별 저장을 부모 「저장」에서 한 번에 호출 */
export type OwnerProductSectionSaveHandle = {
  save: (opts?: { skipBasicsSync?: boolean }) => Promise<void>;
};
