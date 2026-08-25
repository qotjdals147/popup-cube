import type { OwnerOrderView, OrderStatus } from '@popup-cube/shared';
import { formatOrderRef } from './orderRef';

export type OwnerOrderSort = 'newest' | 'oldest';

export interface OwnerOrderFilters {
  query: string;
  status: 'all' | OrderStatus;
  dateFrom: string;
  dateTo: string;
  sort: OwnerOrderSort;
}

export const DEFAULT_OWNER_ORDER_FILTERS: OwnerOrderFilters = {
  query: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

function orderMatchesQuery(order: OwnerOrderView, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const ref = formatOrderRef(order.store_code, order.order_number).toLowerCase();
  const buyer = (order.buyer_nickname ?? '').toLowerCase();
  const num = String(order.order_number);

  return ref.includes(q) || buyer.includes(q) || num.includes(q);
}

function orderMatchesDate(order: OwnerOrderView, dateFrom: string, dateTo: string): boolean {
  if (!dateFrom && !dateTo) return true;
  const created = new Date(order.created_at);
  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (created < from) return false;
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`);
    if (created > to) return false;
  }
  return true;
}

export function filterAndSortOwnerOrders(
  orders: OwnerOrderView[],
  filters: OwnerOrderFilters
): OwnerOrderView[] {
  let list = orders.filter(
    (o) =>
      orderMatchesQuery(o, filters.query) &&
      orderMatchesDate(o, filters.dateFrom, filters.dateTo) &&
      (filters.status === 'all' || o.status === filters.status)
  );

  list = [...list].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return filters.sort === 'oldest' ? ta - tb : tb - ta;
  });

  return list;
}

/** 탭별 상태 필터 옵션 */
export function ownerOrderStatusOptions(
  queue: 'pending' | 'fulfillment' | 'hold'
): Array<{ value: 'all' | OrderStatus; labelKey: string }> {
  if (queue === 'hold') {
    return [
      { value: 'all', labelKey: 'ownerOrders.filterStatusAll' },
      { value: 'on_hold', labelKey: 'ownerOrders.status.on_hold' },
    ];
  }
  if (queue === 'pending') {
    return [
      { value: 'all', labelKey: 'ownerOrders.filterStatusAll' },
      { value: 'awaiting_accept', labelKey: 'ownerOrders.status.awaiting_accept' },
      { value: 'paid', labelKey: 'ownerOrders.status.paid' },
      { value: 'pending', labelKey: 'ownerOrders.status.pending' },
    ];
  }
  return [
    { value: 'all', labelKey: 'ownerOrders.filterStatusAll' },
    { value: 'accepted', labelKey: 'ownerOrders.status.accepted' },
    { value: 'shipped', labelKey: 'ownerOrders.status.shipped' },
    { value: 'delivery_completed', labelKey: 'ownerOrders.status.delivery_completed' },
    { value: 'purchase_confirmed', labelKey: 'ownerOrders.status.purchase_confirmed' },
    { value: 'completed', labelKey: 'ownerOrders.status.completed' },
    { value: 'cancelled', labelKey: 'ownerOrders.status.cancelled' },
  ];
}
