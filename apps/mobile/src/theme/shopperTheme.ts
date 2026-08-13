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

/** v2 설정 다크 모드용 — 기본값은 light (AD-065) */
export const shopperDark = {
  bg: '#0A0E1A',
  bgCard: '#0f3460',
  bgElevated: '#16213e',
  text: '#ffffff',
  textMuted: '#a0a0c0',
  textSoft: '#d8e4ff',
  primary: '#3d8bfd',
  primaryText: '#ffffff',
  accent: '#e94560',
  accentDark: '#c73550',
  border: '#2a3a5c',
  borderStrong: '#2a3a5c',
  openBadge: '#0d5c45',
  price: '#e94560',
  danger: '#fca5a5',
  success: '#6ee7b7',
  overlay: 'rgba(0,0,0,0.65)',
} as const;

export type ShopperThemeColors = typeof shopperLight;
