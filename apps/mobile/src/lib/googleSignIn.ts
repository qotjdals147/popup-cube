import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { getOAuthRedirectUri } from './oauthRedirect';
import { formatSupabaseAuthError, getSupabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/** OAuth callback URL → Supabase session (PKCE code or token fragment) */
export async function createSessionFromOAuthUrl(url: string): Promise<{ error: string | null }> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    return { error: formatSupabaseAuthError(String(errorCode)) };
  }

  if (params.code) {
    const { error } = await getSupabase().auth.exchangeCodeForSession(params.code);
    if (error) return { error: formatSupabaseAuthError(error.message) };
    return { error: null };
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await getSupabase().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { error: formatSupabaseAuthError(error.message) };
    return { error: null };
  }

  return { error: '로그인 응답을 처리하지 못했어요.' };
}

/** AD-078 — Google OAuth (Supabase Auth · Expo WebBrowser) */
export async function signInWithGoogleOAuth(): Promise<{ error: string | null; cancelled?: boolean }> {
  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: formatSupabaseAuthError(error.message) };
  }
  if (!data.url) {
    return { error: 'Google 로그인 페이지를 열지 못했어요.' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: true,
    createTask: false,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { error: null, cancelled: true };
  }
  if (result.type !== 'success') {
    return { error: 'Google 로그인이 완료되지 않았어요.' };
  }

  return createSessionFromOAuthUrl(result.url);
}
