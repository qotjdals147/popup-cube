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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 오늘 기준 이번 달 1일 ~ 말일 (YYYY-MM-DD) */
export function currentMonthDateRange(now = new Date()): { dateFrom: string; dateTo: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    dateFrom: `${y}-${pad2(m + 1)}-01`,
    dateTo: `${y}-${pad2(m + 1)}-${pad2(lastDay)}`,
  };
}

export function defaultOwnerOrderFilters(now = new Date()): OwnerOrderFilters {
  const { dateFrom, dateTo } = currentMonthDateRange(now);
  return {
    query: '',
    status: 'all',
    dateFrom,
    dateTo,
    sort: 'newest',
  };
}

/** @deprecated — `defaultOwnerOrderFilters()` 사용 */
export const DEFAULT_OWNER_ORDER_FILTERS: OwnerOrderFilters = {
  query: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

export type OwnerOrderQueue = 'pending' | 'fulfillment' | 'hold' | 'claims';

export interface OwnerOrderFilterOptions {
  queue?: OwnerOrderQueue;
}

function orderMatchesQuery(order: OwnerOrderView, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const ref = formatOrderRef(order.store_code, order.order_number).toLowerCase();
  const buyer = (order.buyer_nickname ?? '').toLowerCase();
  const num = String(order.order_number);

  return ref.includes(q) || buyer.includes(q) || num.includes(q);
}

function orderMatchesDate(
  order: OwnerOrderView,
  dateFrom: string,
  dateTo: string,
  queue?: OwnerOrderQueue,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const anchorRaw =
    queue === 'claims'
      ? order.claim_created_at ?? order.claim_resolved_at ?? order.created_at
      : order.created_at;
  const anchor = new Date(anchorRaw);
  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (anchor < from) return false;
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`);
    if (anchor > to) return false;
  }
  return true;
}

export function filterAndSortOwnerOrders(
  orders: OwnerOrderView[],
  filters: OwnerOrderFilters,
  options: OwnerOrderFilterOptions = {},
): OwnerOrderView[] {
  const { queue } = options;
  let list = orders.filter(
    (o) =>
      orderMatchesQuery(o, filters.query) &&
      orderMatchesDate(o, filters.dateFrom, filters.dateTo, queue) &&
      (filters.status === 'all' || o.status === filters.status),
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
  queue: OwnerOrderQueue
): Array<{ value: 'all' | OrderStatus; labelKey: string }> {
  if (queue === 'claims') {
    return [
      { value: 'all', labelKey: 'ownerOrders.filterStatusAll' },
      { value: 'shipped', labelKey: 'ownerOrders.status.shipped' },
      { value: 'delivery_completed', labelKey: 'ownerOrders.status.delivery_completed' },
      { value: 'purchase_confirmed', labelKey: 'ownerOrders.status.purchase_confirmed' },
      { value: 'completed', labelKey: 'ownerOrders.status.completed' },
    ];
  }
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
