import * as WebBrowser from 'expo-web-browser';
import {
  beginOAuthFlow,
  createSessionFromOAuthUrl,
  endOAuthFlow,
  hasOAuthSessionUser,
  waitForOAuthCallbackUrl,
  waitForOAuthSession,
} from './oauthExchange';
import { getOAuthRedirectUri } from './oauthRedirect';
import { formatSupabaseAuthError, getSupabase } from './supabase';
import { dismissBrowserSafe, openOAuthUrl } from './webBrowserSafe';

let googleOAuthRunning = false;

/**
 * AD-078 — Google OAuth (Supabase Auth)
 *
 * Android: Linking.openURL → 외부 Chrome (Custom Tab Gmail redirect 회피)
 * iOS: in-app browser + deep link
 */
export async function signInWithGoogleOAuth(): Promise<{ error: string | null; cancelled?: boolean }> {
  if (googleOAuthRunning) {
    return { error: 'Google 로그인이 이미 진행 중이에요.' };
  }

  googleOAuthRunning = true;
  WebBrowser.maybeCompleteAuthSession();
  const flowId = beginOAuthFlow();

  try {
    await dismissBrowserSafe();

    const redirectTo = getOAuthRedirectUri();

    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          // consent 강제는 매번 「앱 미인증」경고·부가 화면 노출을 늘림 → select_account만
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return { error: formatSupabaseAuthError(error.message) };
    }
    if (!data.url) {
      return { error: 'Google 로그인 페이지를 열지 못했어요.' };
    }

    // ISS-040 진단용 — data.url에는 client_secret이 없어 로그 노출 안전
    if (__DEV__) {
      try {
        const u = new URL(data.url);
        console.log('[oauth-debug] authorize URL host:', u.origin + u.pathname);
        console.log('[oauth-debug] redirect_uri:', u.searchParams.get('redirect_uri'));
        console.log('[oauth-debug] client_id:', u.searchParams.get('client_id'));
        console.log('[oauth-debug] scope:', u.searchParams.get('scope'));
        console.log('[oauth-debug] prompt:', u.searchParams.get('prompt'));
        console.log('[oauth-debug] has code_challenge:', !!u.searchParams.get('code_challenge'));
        console.log('[oauth-debug] has state:', !!u.searchParams.get('state'));
      } catch (e) {
        console.log('[oauth-debug] failed to parse data.url', e);
      }
    }

    const callbackPromise = waitForOAuthCallbackUrl({
      ignoreInitialUrl: true,
      flowId,
    });

    const opened = await openOAuthUrl(data.url);
    if (!opened) {
      return { error: 'Google 로그인 페이지를 열지 못했어요.' };
    }

    const callbackUrl = await callbackPromise;

    if (callbackUrl) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const sessionResult = await createSessionFromOAuthUrl(callbackUrl);
      if (!sessionResult.error || (await hasOAuthSessionUser())) {
        await dismissBrowserSafe();
        return { error: null };
      }
      return sessionResult;
    }

    if (await waitForOAuthSession(3000)) {
      await dismissBrowserSafe();
      return { error: null };
    }

    if (await hasOAuthSessionUser()) {
      await dismissBrowserSafe();
      return { error: null };
    }

    return { error: null, cancelled: true };
  } finally {
    googleOAuthRunning = false;
    endOAuthFlow();
    await dismissBrowserSafe();
  }
}

export { createSessionFromOAuthUrl } from './oauthExchange';
