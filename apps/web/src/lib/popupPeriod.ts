/** §58 #6 — popup_ends_at ↔ date input (점주 개요) */

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
