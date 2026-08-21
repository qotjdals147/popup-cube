/** §58 #6 — popup_ends_at ↔ date input (점주 개요) · §58 #5 종료 판정 */

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 손님 홈 D-day와 동일 — 종료일(KST 캘린더) 다음 날부터 true */
export function isPopupEnded(popupEndsAt: string | null | undefined, now = new Date()): boolean {
  if (!popupEndsAt) return false;
  const end = new Date(popupEndsAt);
  if (Number.isNaN(end.getTime())) return false;
  const daysLeft = Math.round((startOfLocalDay(end) - startOfLocalDay(now)) / 86400000);
  return daysLeft < 0;
}

export function popupEndsAtToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** KST 23:59:59 — 손님 홈 D-day 기준일 */
export function dateInputToPopupEndsAt(date: string): string | null {
  const trimmed = date.trim();
  if (!trimmed) return null;
  return new Date(`${trimmed}T23:59:59+09:00`).toISOString();
}
