/** 점주 입력용 — 숫자만 남기고 천 단위 쉼표 표시 (원·개·건) */
export function formatIntegerDisplay(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('ko-KR');
}

export function parseIntegerInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return NaN;
  return parseInt(digits, 10);
}

/** input onChange — 숫자만 허용, 입력 중에도 쉼표 표시 */
export function formatIntegerInputRaw(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}
