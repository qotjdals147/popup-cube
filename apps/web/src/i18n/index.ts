import { ko, type MessageTree } from './ko';

/** 현재 지원 언어 — 출시: ko only. 향후 'en' | 'ja' 등 확장 */
export type Locale = 'ko';

const DEFAULT_LOCALE: Locale = 'ko';

const catalogs: Record<Locale, MessageTree> = { ko };

/**
 * UI 문구 조회 — 키 예: 'store.hud.explore'
 * params를 넘기면 문구 안의 {key} 자리를 값으로 치환 (예: t('a.b', { seconds: 30 }))
 */
export function t(
  path: string,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  const keys = path.split('.');
  let node: unknown = catalogs[locale];
  for (const key of keys) {
    if (node && typeof node === 'object' && key in (node as object)) {
      node = (node as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  if (typeof node !== 'string') return path;
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

export function getRoleLabel(role: string | null, locale: Locale = DEFAULT_LOCALE): string {
  if (!role) return catalogs[locale].roles.unknown;
  const key = role as keyof MessageTree['roles'];
  return catalogs[locale].roles[key] ?? catalogs[locale].roles.unknown;
}

/** Supabase Auth 영문 에러 → 한국어 (향후 locale별 매핑 테이블로 확장) */
export function getAuthErrorMessage(error: string, locale: Locale = DEFAULT_LOCALE): string {
  const map = catalogs[locale].authErrors;
  return (map as Record<string, string>)[error] ?? map.default;
}

export { DEFAULT_LOCALE };
