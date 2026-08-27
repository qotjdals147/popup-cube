/** AD-077 — 문의 접수·답변 시각 (서버 timestamptz → ko-KR) */
export function formatClaimDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
