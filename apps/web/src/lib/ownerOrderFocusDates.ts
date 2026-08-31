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

/** 주문 본문(주문·수정대기·발주·배송) — 주문 생성일 */
export function focusDateFromForOrderHome(order: OwnerOrderView): string {
  return dateInputFromIso(order.created_at);
}

/** 반품·교환 — 첫 신청일 */
export function focusDateFromForReturn(order: OwnerOrderView): string {
  return dateInputFromIso(order.return_requested_at ?? order.created_at);
}

/** 문의 — 1차 문의일 (이력 API → fallback claim_created_at → 주문일) */
export async function focusDateFromForClaim(order: OwnerOrderView): Promise<string> {
  try {
    const rounds = await listOrderClaimHistory(order.id);
    if (rounds.length > 0) {
      const earliest = rounds.reduce((min, row) => {
        const t = new Date(row.shopper_created_at).getTime();
        return t < min.t ? { t, iso: row.shopper_created_at } : min;
      }, { t: new Date(rounds[0].shopper_created_at).getTime(), iso: rounds[0].shopper_created_at });
      const fromHistory = dateInputFromIso(earliest.iso);
      if (fromHistory) return fromHistory;
    }
  } catch {
    // 이력 RPC 실패 시 orders 캐시로 fallback
  }
  return dateInputFromIso(order.claim_created_at ?? order.created_at);
}

export type RelatedFocusKind = 'claim' | 'return' | 'orderHome';

export async function focusDateRangeForRelatedLink(
  order: OwnerOrderView,
  kind: RelatedFocusKind,
): Promise<{ dateFrom: string; dateTo: string }> {
  const dateTo = todayDateInput();
  let dateFrom: string;
  if (kind === 'claim') {
    dateFrom = await focusDateFromForClaim(order);
  } else if (kind === 'return') {
    dateFrom = focusDateFromForReturn(order);
  } else {
    dateFrom = focusDateFromForOrderHome(order);
  }
  if (!dateFrom) dateFrom = dateInputFromIso(order.created_at);
  return { dateFrom, dateTo };
}
