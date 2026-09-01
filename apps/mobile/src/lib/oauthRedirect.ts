import { makeRedirectUri } from 'expo-auth-session';

/** AD-078 — Supabase OAuth 복귀 deep link */
export const OAUTH_REDIRECT_PATH = 'login-callback';

/**
 * Expo Go → `exp://…/--/login-callback` · 스토어 빌드 → `popupcube://login-callback`
 * Supabase Redirect URLs에 `exp://**` + `popupcube://**` 둘 다 필요 (§7.73)
 */
export function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'popupcube',
    path: OAUTH_REDIRECT_PATH,
    native: 'popupcube://login-callback',
  });
}
