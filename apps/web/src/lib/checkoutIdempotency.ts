/** ISS-047 — 결제 시도 1회당 UUID (매장별 place_order에 동일 키 전달) */
export function createCheckoutIdempotencyKey(): string {
  return crypto.randomUUID();
}
