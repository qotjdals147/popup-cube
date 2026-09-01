/** 「연결된 처리」→ 탭 이동 후 해당 주문 카드 포커스 */
export type OwnerOrderFocus = {
  orderId: string;
  orderQuery: string;
  dateFrom: string;
  dateTo: string;
  /** 동일 orderId 재적용 방지 */
  focusKey: string;
  openClaimHistory?: boolean;
  /** 반품·교환 탭 — 거절·완료 이력 보기 */
  returnsListFilter?: OwnerReturnListFilter;
};

export type OwnerReturnListFilter = 'active' | 'history';
