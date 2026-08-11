import type React from 'react';

/** 점주 PC 관리센터 — 스마트스토어·배민·쿠팡이츠형 화이트/그레이 톤 (AD-057) */
export const ownerFont =
  "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

/** 점주 PC — 기본보다 약 +2pt (가독성) */
export const ownerFontSize = {
  xs: 13,
  sm: 14,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const;

export const ownerColors = {
  pageBg: '#f4f5f7',
  surface: '#ffffff',
  surfaceMuted: '#f9fafb',
  surfaceHover: '#f2f4f6',
  /** 에이블리형 — 왼쪽 탭 영역만 진한 네이비, 본문은 화이트 유지 */
  sidebarBg: '#2b3340',
  sidebarBorder: '#3d4654',
  sidebarText: '#b8c0cc',
  sidebarTextActive: '#ffffff',
  sidebarNavHoverBg: 'rgba(255,255,255,0.06)',
  sidebarNavActiveBg: '#3d4f63',
  headerBg: '#ffffff',
  border: '#e5e8eb',
  borderStrong: '#d1d6db',
  text: '#191f28',
  textSecondary: '#4e5968',
  textMuted: '#8b95a1',
  primary: '#3182f6',
  primaryText: '#ffffff',
  danger: '#e03131',
  dangerText: '#c92a2a',
  dangerBg: '#fff5f5',
  dangerBorder: '#ffc9c9',
  success: '#087f5b',
  successText: '#087f5b',
  successBg: '#ebfbee',
  successBorder: '#b2f2bb',
  warning: '#e67700',
  warningText: '#d9480f',
  warningBg: '#fff9db',
  warningBorder: '#ffe066',
  badgeRed: '#f04452',
  orderRef: '#2563eb',
  price: '#191f28',
  navActiveBg: '#eef4ff',
  navActiveText: '#2563eb',
  sidebarNavActiveBorder: '#60a5fa',
  shadow: '0 1px 3px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.4)',
} as const;

const c = ownerColors;

/** 공통 입력 필드 */
export const ownerInput: React.CSSProperties = {
  borderRadius: 8,
  border: `1px solid ${c.borderStrong}`,
  background: c.surface,
  color: c.text,
  fontSize: 14,
  boxSizing: 'border-box',
};

/** 공통 카드/패널 */
export const ownerPanel: React.CSSProperties = {
  background: c.surface,
  borderRadius: 12,
  border: `1px solid ${c.border}`,
  boxShadow: c.shadow,
};

/** 페이지 래퍼 */
export const ownerPage: React.CSSProperties = {
  minHeight: '100vh',
  background: c.pageBg,
  color: c.text,
  fontFamily: ownerFont,
};

/** 헤더 바 */
export const ownerHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: '16px 28px',
  background: c.headerBg,
  borderBottom: `1px solid ${c.border}`,
  flexWrap: 'wrap',
};

/** 고스트(아웃라인) 버튼 */
export const ownerGhostBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: `1px solid ${c.borderStrong}`,
  background: c.surface,
  color: c.textSecondary,
  fontSize: 13,
  cursor: 'pointer',
};

/** 주요(파란) 버튼 */
export const ownerPrimaryBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: 'none',
  background: c.primary,
  color: c.primaryText,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

/** 게시됨 뱃지 */
export const ownerBadgePublished: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 10px',
  borderRadius: 999,
  background: c.successBg,
  color: c.successText,
  border: `1px solid ${c.successBorder}`,
};

/** 임시저장(초안) 뱃지 */
export const ownerBadgeDraft: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 10px',
  borderRadius: 999,
  background: c.warningBg,
  color: c.warningText,
  border: `1px solid ${c.warningBorder}`,
};
