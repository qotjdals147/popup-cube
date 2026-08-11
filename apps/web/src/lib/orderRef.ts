/** 사람용 주문번호 — `{store_code}-{order_number}` (예: GUCCI-1042) */
export function formatOrderRef(storeCode: string, orderNumber: number): string {
  return `${storeCode}-${orderNumber}`;
}

/** 매장 주문 코드 입력 정규화 — 영문·숫자만, 대문자, 최대 12자 */
export function normalizeStoreCode(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
}

/** 매장 이름에서 주문 코드 자동 제안 (영문·숫자만 추출) */
export function suggestStoreCodeFromName(name: string): string {
  return normalizeStoreCode(name);
}

export function isValidStoreCode(code: string): boolean {
  return /^[A-Z0-9]{2,12}$/.test(code);
}
