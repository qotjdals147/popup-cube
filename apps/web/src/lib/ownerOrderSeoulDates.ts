/** 점주 주문 필터 — `get_store_kpi`와 동일하게 Asia/Seoul 달력 기준 (ISS-056) */

export const OWNER_ORDER_TZ = 'Asia/Seoul';

/** ISO 시각 → 서울 `<input type="date">` (YYYY-MM-DD) */
export function seoulDateInputFromIso(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: OWNER_ORDER_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function seoulTodayDateInput(now = new Date()): string {
  return seoulDateInputFromIso(now.toISOString());
}

function dateInputToOrdinal(dateInput: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());
  if (!m) return null;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
}

function isoToSeoulOrdinal(iso: string): number | null {
  const input = seoulDateInputFromIso(iso);
  return input ? dateInputToOrdinal(input) : null;
}

/** 주문·클레임 앵커 시각이 서울 기준 dateFrom~dateTo 안인지 */
export function anchorIsoInSeoulDateRange(
  anchorIso: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const anchor = isoToSeoulOrdinal(anchorIso);
  if (anchor == null) return true;
  if (dateFrom) {
    const from = dateInputToOrdinal(dateFrom);
    if (from != null && anchor < from) return false;
  }
  if (dateTo) {
    const to = dateInputToOrdinal(dateTo);
    if (to != null && anchor > to) return false;
  }
  return true;
}
