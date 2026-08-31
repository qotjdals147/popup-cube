/** 「연결된 처리」→ 탭 이동 후 해당 주문 카드 포커스 */
export type OwnerOrderFocus = {
  orderId: string;
  orderQuery: string;
  openClaimHistory?: boolean;
};

export function ownerOrderFocusFromNavigate(target: {
  orderId?: string;
  orderQuery?: string;
  openClaimHistory?: boolean;
}): OwnerOrderFocus | null {
  if (!target.orderId || !target.orderQuery) return null;
  return {
    orderId: target.orderId,
    orderQuery: target.orderQuery,
    openClaimHistory: target.openClaimHistory,
  };
}
