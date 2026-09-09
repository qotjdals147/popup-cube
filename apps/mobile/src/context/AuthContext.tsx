import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { UserRole } from '../types/domain';
import { signInWithGoogleOAuth } from '../lib/googleSignIn';
import {
  isNativeGoogleSignInAvailable,
  signInWithGoogleNative,
  signOutGoogleNative,
} from '../lib/googleSignInNative';
import { resetOAuthExchangeState } from '../lib/oauthExchange';
import { getSupabase, isSupabaseConfigured, formatSupabaseAuthError, isJwtClockSkewError } from '../lib/supabase';
import { dismissBrowserSafe } from '../lib/webBrowserSafe';

interface AuthState {
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  storeId: string | null;
  nickname: string | null;
  /** 로그인·가입·OAuth 진행 중 */
  loading: boolean;
  /** 앱 켜짐 직후 getSession 1회 — 랜딩(/)은 막지 않음 */
  bootstrapping: boolean;
  /** Supabase 미설정·네트워크 타임아웃 등 */
  initError: string | null;
}

interface AuthContextValue extends AuthState {
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    nickname: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null; ok: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_INIT_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function idleAuth(patch: Omit<Partial<AuthState>, 'loading' | 'bootstrapping'>): Partial<AuthState> {
  return { ...patch, loading: false, bootstrapping: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const oauthBusyRef = useRef(false);
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    role: null,
    storeId: null,
    nickname: null,
    loading: false,
    bootstrapping: true,
    initError: null,
  });

  async function loadProfile(userId: string, email: string | null, attempt = 1): Promise<boolean> {
    const maxAttempts = 3;
    try {
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      const { data, error } = await withTimeout(
        getSupabase().from('profiles').select('role, store_id, nickname').eq('id', userId).single(),
        AUTH_INIT_TIMEOUT_MS,
        'profile'
      );

      if (error) {
        console.error('[auth] profile load failed:', error.message);
        if (isJwtClockSkewError(error.message)) {
          await getSupabase().auth.signOut();
          resetOAuthExchangeState();
          setState((s) => ({
            ...s,
            ...idleAuth({
              userId: null,
              email: null,
              role: null,
              storeId: null,
              nickname: null,
              initError: formatSupabaseAuthError(error.message),
            }),
          }));
          return false;
        }
        setState((s) => ({
          ...s,
          ...idleAuth({
            userId,
            email,
            role: null,
            storeId: null,
            nickname: null,
            initError: null,
          }),
        }));
        return false;
      }

      setState((s) => ({
        ...s,
        ...idleAuth({
          userId,
          email,
          role: data.role,
          storeId: data.store_id,
          nickname: data.nickname,
          initError: null,
        }),
      }));
      return true;
    } catch (err) {
      console.error('[auth] profile load error:', err);
      if (attempt < maxAttempts && err instanceof Error && err.message.includes('timeout')) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return loadProfile(userId, email, attempt + 1);
      }
      setState((s) => ({
        ...s,
        ...idleAuth({
          userId,
          email,
          role: null,
          storeId: null,
          nickname: null,
          initError: '프로필을 불러오지 못했어요. 네트워크를 확인해 주세요.',
        }),
      }));
      return false;
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState((s) => ({
        ...s,
        ...idleAuth({
          initError: 'Supabase 설정이 없습니다. apps/mobile/.env 를 확인하세요.',
        }),
      }));
      return;
    }

    let active = true;
    let cleanupAuth: (() => void) | undefined;

    const safetyTimer = setTimeout(() => {
      if (!active || oauthBusyRef.current) return;
      setState((s) =>
        s.bootstrapping || s.loading
          ? {
              ...s,
              ...idleAuth({
                initError: s.initError ?? '로그인 확인 시간이 초과됐어요. 다시 시도해 주세요.',
              }),
            }
          : s,
      );
    }, AUTH_INIT_TIMEOUT_MS + 3_000);

    const timer = setTimeout(() => {
      let sb;
      try {
        sb = getSupabase();
      } catch (err) {
        console.error('[auth] getSupabase failed:', err);
        if (active) {
          setState((s) => ({
            ...s,
            ...idleAuth({
              initError: 'Supabase 설정 오류입니다. Expo를 --clear 로 재시작해 주세요.',
            }),
          }));
        }
        return;
      }

      withTimeout(sb.auth.getSession(), AUTH_INIT_TIMEOUT_MS, 'session')
        .then(({ data }) => {
          if (!active) return;
          const user = data.session?.user;
          if (user) {
            void loadProfile(user.id, user.email ?? null);
          } else {
            setState((s) => ({ ...s, ...idleAuth({ initError: null }) }));
          }
        })
        .catch((err) => {
          console.error('[auth] getSession failed:', err);
          if (active) {
            setState((s) => ({
              ...s,
              ...idleAuth({
                initError: '로그인 상태 확인에 실패했어요. Wi‑Fi/데이터를 확인해 주세요.',
              }),
            }));
          }
        });

      const { data: subscription } = sb.auth.onAuthStateChange((_event, session) => {
        // OAuth exchangeCodeForSession 중 Supabase 재호출 시 데드락 방지 — supabase-js#1429
        setTimeout(() => {
          if (!active) return;
          const user = session?.user;
          if (user) {
            void loadProfile(user.id, user.email ?? null);
          } else {
            setState((s) => ({
              ...s,
              ...idleAuth({
                userId: null,
                email: null,
                role: null,
                storeId: null,
                nickname: null,
                initError: null,
              }),
            }));
          }
        }, 0);
      });

      cleanupAuth = () => subscription.subscription.unsubscribe();
    }, 50);

    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      cleanupAuth?.();
    };
  }, []);

  async function signInWithPassword(email: string, password: string) {
    setState((s) => ({ ...s, loading: true, initError: null }));
    try {
      const { data, error } = await withTimeout(
        getSupabase().auth.signInWithPassword({ email, password }),
        AUTH_INIT_TIMEOUT_MS,
        'signIn'
      );
      if (error) {
        setState((s) => ({ ...s, loading: false }));
        return { error: formatSupabaseAuthError(error.message) };
      }
      const user = data.session?.user ?? data.user;
      if (user) {
        await loadProfile(user.id, user.email ?? null);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
      return { error: null };
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        initError: '로그인 요청 시간이 초과됐어요. 네트워크를 확인해 주세요.',
      }));
      return { error: '로그인 요청 시간이 초과됐어요.' };
    }
  }

  async function signUp(email: string, password: string, nickname: string) {
    setState((s) => ({ ...s, loading: true, initError: null }));
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });

    if (error) {
      setState((s) => ({ ...s, loading: false }));
      return { error: formatSupabaseAuthError(error.message), needsEmailConfirmation: false };
    }

    const needsEmailConfirmation = !data.session;
    if (needsEmailConfirmation) {
      setState((s) => ({ ...s, loading: false }));
    }
    return { error: null, needsEmailConfirmation };
  }

  async function finishGoogleSignIn(): Promise<{ error: string | null; ok: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const { data } = await getSupabase().auth.getSession();
    const user = data.session?.user;
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return { error: null, ok: false };
    }
    const profileOk = await loadProfile(user.id, user.email ?? null);
    return { error: null, ok: profileOk };
  }

  async function signInWithGoogle() {
    setState((s) => ({ ...s, loading: true, initError: null }));
    oauthBusyRef.current = true;
    try {
      // §7.82 — EAS Dev Client 빌드(네이티브 모듈 O)면 우선 사용 (Expo Go는 브라우저 방식 유지)
      if (isNativeGoogleSignInAvailable()) {
        const nativeResult = await signInWithGoogleNative();
        if (nativeResult.error !== 'native-unavailable') {
          if (nativeResult.cancelled) {
            setState((s) => ({ ...s, loading: false }));
            return { error: null, ok: false };
          }
          if (nativeResult.error) {
            setState((s) => ({ ...s, loading: false }));
            return { error: nativeResult.error, ok: false };
          }
          return finishGoogleSignIn();
        }
      }

      const { error, cancelled } = await signInWithGoogleOAuth();
      if (cancelled) {
        setState((s) => ({ ...s, loading: false }));
        return { error: null, ok: false };
      }
      if (error) {
        const recovered = await finishGoogleSignIn();
        if (recovered.ok) return recovered;
        setState((s) => ({ ...s, loading: false }));
        return { error, ok: false };
      }
      return finishGoogleSignIn();
    } catch (err) {
      console.error('[auth] Google sign-in error:', err);
      const recovered = await finishGoogleSignIn();
      if (recovered.ok) return recovered;
      setState((s) => ({ ...s, loading: false }));
      return { error: 'Google 로그인 요청에 실패했어요.', ok: false };
    } finally {
      oauthBusyRef.current = false;
    }
  }

  async function signOut() {
    oauthBusyRef.current = false;
    await dismissBrowserSafe();
    resetOAuthExchangeState();
    await signOutGoogleNative();
    await getSupabase().auth.signOut();
    await new Promise((resolve) => setTimeout(resolve, 400));
    setState((s) => ({
      ...s,
      ...idleAuth({
        userId: null,
        email: null,
        role: null,
        storeId: null,
        nickname: null,
        initError: null,
      }),
    }));
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithPassword, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
