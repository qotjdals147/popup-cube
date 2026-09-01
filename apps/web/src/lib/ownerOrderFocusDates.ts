import type { OwnerOrderView } from '@popup-cube/shared';
import { listOrderClaimHistory } from './orders';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO → `<input type="date">` (로컬 날짜) */
export function dateInputFromIso(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayDateInput(now = new Date()): string {
  return dateInputFromIso(now.toISOString());
}

/** 점주 주문 필터 · 연결 이동 공통 — A=매장 오픈일 · B=오늘 */
export function storeOrderDateRange(
  storeCreatedAt: string | null | undefined,
  now = new Date(),
): { dateFrom: string; dateTo: string } {
  return {
    dateFrom: storeCreatedAt ? dateInputFromIso(storeCreatedAt) : '',
    dateTo: todayDateInput(now),
  };
}

/** @deprecated — `storeOrderDateRange()` 사용 */
export function focusDateFromForOrderHome(order: OwnerOrderView): string {
  return dateInputFromIso(order.created_at);
}

/** @deprecated — `storeOrderDateRange()` 사용 */
export function focusDateFromForReturn(order: OwnerOrderView): string {
  return dateInputFromIso(order.return_requested_at ?? order.created_at);
}

/** @deprecated — `storeOrderDateRange()` 사용 */
export async function focusDateFromForClaim(order: OwnerOrderView): Promise<string> {
  try {
    const rounds = await listOrderClaimHistory(order.id);
    if (rounds.length > 0) {
      const earliest = rounds.reduce(
        (min, row) => {
          const t = new Date(row.shopper_created_at).getTime();
          return t < min.t ? { t, iso: row.shopper_created_at } : min;
        },
        { t: new Date(rounds[0].shopper_created_at).getTime(), iso: rounds[0].shopper_created_at },
      );
      const fromHistory = dateInputFromIso(earliest.iso);
      if (fromHistory) return fromHistory;
    }
  } catch {
    // 이력 RPC 실패 시 orders 캐시로 fallback
  }
  return dateInputFromIso(order.claim_created_at ?? order.created_at);
}

export type RelatedFocusKind = 'claim' | 'return' | 'orderHome';

/** 연결 이동 — 매장 오픈일~오늘 (전 탭 동일) */
export function focusDateRangeForRelatedLink(
  storeCreatedAt: string | null | undefined,
  now = new Date(),
): { dateFrom: string; dateTo: string } {
  return storeOrderDateRange(storeCreatedAt, now);
}
