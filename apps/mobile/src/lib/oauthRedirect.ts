import * as Linking from 'expo-linking';

/** AD-078 — Supabase OAuth 복귀 deep link (`app.config.ts` scheme: popupcube) */
export const OAUTH_REDIRECT_PATH = 'login-callback';

export function getOAuthRedirectUri(): string {
  return Linking.createURL(OAUTH_REDIRECT_PATH);
}
