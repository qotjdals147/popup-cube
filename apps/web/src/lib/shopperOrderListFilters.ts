import type { ShopperOrderView } from '@popup-cube/shared';

export type ShopperOrderListFilter = 'all' | 'returns' | 'claims';

export function orderHasReturnHistory(order: ShopperOrderView): boolean {
  return order.return_status !== 'none';
}

export function orderHasClaimHistory(order: ShopperOrderView): boolean {
  return order.claim_status !== 'none';
}

export function filterShopperOrders(orders: ShopperOrderView[], filter: ShopperOrderListFilter): ShopperOrderView[] {
  if (filter === 'all') return orders;
  if (filter === 'returns') return orders.filter(orderHasReturnHistory);
  return orders.filter(orderHasClaimHistory);
}

export function shopperOrderRowAccentClass(order: ShopperOrderView): string | undefined {
  if (order.return_status === 'rejected') return 'oh-row--return-rejected';
  if (order.return_status === 'requested') return 'oh-row--return-pending';
  if (order.return_status === 'approved') return 'oh-row--return-approved';
  if (order.claim_status === 'open') return 'oh-row--claim-open';
  return undefined;
}
