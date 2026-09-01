import type { ShopperOrderView } from '@popup-cube/shared';

export function formatOrderPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

export function formatOrderDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** 쿠팡형 날짜 헤더 — 예: 2026. 8. 25. */
export function formatOrderDateGroup(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function groupOrdersByDate(
  orders: ShopperOrderView[],
): Array<{ dateKey: string; orders: ShopperOrderView[] }> {
  const byDate = new Map<string, ShopperOrderView[]>();
  for (const order of orders) {
    const key = formatOrderDateGroup(order.created_at);
    const list = byDate.get(key) ?? [];
    list.push(order);
    byDate.set(key, list);
  }
  const seen = new Set<string>();
  const groups: Array<{ dateKey: string; orders: ShopperOrderView[] }> = [];
  for (const order of orders) {
    const key = formatOrderDateGroup(order.created_at);
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push({ dateKey: key, orders: byDate.get(key) ?? [order] });
  }
  return groups;
}
