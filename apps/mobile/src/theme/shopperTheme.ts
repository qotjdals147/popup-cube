/** AD-065 — 손님 앱 라이트 테마 (점주 PC ownerAdminTheme · shop WebView와 동일 톤) */
export const shopperLight = {
  bg: '#f4f5f7',
  bgCard: '#ffffff',
  bgElevated: '#ffffff',
  text: '#191f28',
  textMuted: '#8b95a1',
  textSoft: '#4e5968',
  primary: '#3182f6',
  primaryText: '#ffffff',
  accent: '#3182f6',
  accentDark: '#2563eb',
  border: '#e5e8eb',
  borderStrong: '#d1d6db',
  openBadge: '#087f5b',
  price: '#f04452',
  danger: '#e03131',
  success: '#087f5b',
  overlay: 'rgba(0,0,0,0.45)',
} as const;

/**
 * §60 4-C — 쿠팡·에이블리형 **쇼핑 다크** (차콜·회색 카드).
 * 예전 월드/게임 네이비(#0A0E1A·#0f3460) ❌ — 라이트와 같은 primary blue 유지.
 */
export const shopperDark = {
  bg: '#121214',
  bgCard: '#1c1c1f',
  bgElevated: '#252528',
  text: '#f2f4f6',
  textMuted: '#98989f',
  textSoft: '#c4c8cc',
  primary: '#3182f6',
  primaryText: '#ffffff',
  accent: '#3182f6',
  accentDark: '#2563eb',
  border: '#2e2e32',
  borderStrong: '#3a3a3e',
  openBadge: '#087f5b',
  price: '#ff6b7a',
  danger: '#ff8787',
  success: '#51cf66',
  overlay: 'rgba(0,0,0,0.55)',
} as const;

export type ShopperThemeColors = typeof shopperLight | typeof shopperDark;
