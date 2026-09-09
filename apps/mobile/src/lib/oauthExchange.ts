import * as Linking from 'expo-linking';
import { parseOAuthCallbackParams } from './oauthQueryParams';
import { formatSupabaseAuthError, getSupabase } from './supabase';
import { OAUTH_REDIRECT_PATH } from './oauthRedirect';

/** PKCE code는 1회만 — WebBrowser + login-callback deep link 동시 처리 방지 */
let exchangeInFlight: Promise<{ error: string | null }> | null = null;
let lastExchangedCode: string | null = null;
let oauthFlowActive = false;
let oauthFlowId = 0;
let cancelPendingCallbackWait: (() => void) | null = null;

export function cancelOAuthCallbackWait(): void {
  cancelPendingCallbackWait?.();
  cancelPendingCallbackWait = null;
}

export function resetOAuthExchangeState(): void {
  cancelOAuthCallbackWait();
  exchangeInFlight = null;
  lastExchangedCode = null;
  oauthFlowActive = false;
}

/** login.tsx Google 버튼 → 브라우저 닫힐 때까지 login-callback이 교환하지 않도록 */
export function beginOAuthFlow(): number {
  cancelOAuthCallbackWait();
  oauthFlowActive = true;
  exchangeInFlight = null;
  lastExchangedCode = null;
  oauthFlowId += 1;
  return oauthFlowId;
}

export function endOAuthFlow(): void {
  oauthFlowActive = false;
  cancelOAuthCallbackWait();
}

export function isOAuthFlowActive(): boolean {
  return oauthFlowActive;
}

export function getOAuthFlowId(): number {
  return oauthFlowId;
}

function isOAuthCallbackUrl(url: string): boolean {
  return url.includes(OAUTH_REDIRECT_PATH);
}

/** OAuth callback URL → Supabase session (PKCE code or token fragment) */
export async function createSessionFromOAuthUrl(url: string): Promise<{ error: string | null }> {
  const { params, errorCode } = parseOAuthCallbackParams(url);
  if (errorCode) {
    return { error: formatSupabaseAuthError(String(errorCode)) };
  }

  if (params.code) {
    const code = String(params.code);
    if (lastExchangedCode === code) {
      return { error: null };
    }
    if (exchangeInFlight) {
      return exchangeInFlight;
    }

    exchangeInFlight = (async () => {
      try {
        const { error } = await getSupabase().auth.exchangeCodeForSession(code);
        if (!error) {
          lastExchangedCode = code;
          return { error: null };
        }
        if (/invalid|expired|already been used/i.test(error.message)) {
          const { data } = await getSupabase().auth.getSession();
          if (data.session) {
            lastExchangedCode = code;
            return { error: null };
          }
        }
        return { error: formatSupabaseAuthError(error.message) };
      } finally {
        exchangeInFlight = null;
      }
    })();

    return exchangeInFlight;
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

/** WebBrowser dismiss 직후 deep link exchange가 끝날 때까지 대기 */
export async function waitForOAuthSession(ms = 2500): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const { data } = await getSupabase().auth.getSession();
    if (data.session) return true;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  const { data } = await getSupabase().auth.getSession();
  return Boolean(data.session);
}

type WaitForOAuthCallbackOptions = {
  timeoutMs?: number;
  /** googleSignIn: 이전 getInitialURL(stale code) 재사용 방지 */
  ignoreInitialUrl?: boolean;
  /** beginOAuthFlow()가 반환한 id — 이전 flow deep link 무시 */
  flowId?: number;
};

/** deep link(login-callback) 수신까지 대기 */
export function waitForOAuthCallbackUrl(options: WaitForOAuthCallbackOptions = {}): Promise<string | null> {
  const { timeoutMs = 120_000, ignoreInitialUrl = false, flowId } = options;

  cancelOAuthCallbackWait();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (url: string | null) => {
      if (settled) return;
      settled = true;
      if (cancelPendingCallbackWait === cancelSelf) {
        cancelPendingCallbackWait = null;
      }
      clearTimeout(timer);
      sub.remove();
      resolve(url);
    };

    const cancelSelf = () => finish(null);
    cancelPendingCallbackWait = cancelSelf;

    const accept = (url: string) => {
      if (flowId != null && flowId !== oauthFlowId) return;
      if (isOAuthCallbackUrl(url)) finish(url);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    const sub = Linking.addEventListener('url', ({ url }) => accept(url));

    if (!ignoreInitialUrl) {
      void Promise.resolve(Linking.getInitialURL?.())
        .then((url) => {
          if (url) accept(url);
        })
        .catch(() => undefined);
    }
  });
}

/** 로그인 성공 여부 — exchange 오류와 무관하게 세션 기준 */
export async function hasOAuthSessionUser(): Promise<boolean> {
  const { data } = await getSupabase().auth.getSession();
  return Boolean(data.session?.user);
}
