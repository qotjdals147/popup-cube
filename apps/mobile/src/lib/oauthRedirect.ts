import * as Linking from 'expo-linking';

/** AD-078 — Supabase OAuth 복귀 deep link */
export const OAUTH_REDIRECT_PATH = 'login-callback';

/**
 * Expo Go → `exp://…/--/login-callback` · Dev Client/스토어 → `popupcube://login-callback`
 * Supabase Redirect URLs에 `exp://**` + `popupcube://**` 둘 다 필요 (§7.74)
 *
 * makeRedirectUri(expo-auth-session) 대신 Linking — Dev Client에서 ExpoCrypto 네이티브 모듈 불필요
 */
export function getOAuthRedirectUri(): string {
  return Linking.createURL(OAUTH_REDIRECT_PATH);
}

/** Android Custom Tab — redirect prefix match (trailing `?`) */
export function getOAuthAuthSessionRedirect(): string {
  const redirectTo = getOAuthRedirectUri();
  return redirectTo.includes('?') ? redirectTo : `${redirectTo}?`;
}
