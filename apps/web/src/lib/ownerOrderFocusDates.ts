import type { OwnerOrderView } from '@popup-cube/shared';
import { listOrderClaimHistory } from './orders';
import { seoulDateInputFromIso, seoulTodayDateInput } from './ownerOrderSeoulDates';

/** ISO → `<input type="date">` (서울 달력 — 점주 주문 필터) */
export function dateInputFromIso(iso: string | null | undefined): string {
  return seoulDateInputFromIso(iso);
}

export function todayDateInput(now = new Date()): string {
  return seoulTodayDateInput(now);
}

/** 점주 주문 필터 · 연결 이동 공통 — A=매장 오픈일 · B=오늘 (Asia/Seoul) */
export function storeOrderDateRange(
  storeCreatedAt: string | null | undefined,
  now = new Date(),
): { dateFrom: string; dateTo: string } {
  return {
    dateFrom: storeCreatedAt ? seoulDateInputFromIso(storeCreatedAt) : '',
    dateTo: seoulTodayDateInput(now),
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
