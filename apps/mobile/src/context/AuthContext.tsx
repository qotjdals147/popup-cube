import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserRole } from '../types/domain';
import { signInWithGoogleOAuth } from '../lib/googleSignIn';
import { getSupabase, isSupabaseConfigured, formatSupabaseAuthError, isJwtClockSkewError } from '../lib/supabase';

interface AuthState {
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  storeId: string | null;
  nickname: string | null;
  loading: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    role: null,
    storeId: null,
    nickname: null,
    loading: true,
    initError: null,
  });

  async function loadProfile(userId: string, email: string | null) {
    try {
      const { data, error } = await withTimeout(
        getSupabase().from('profiles').select('role, store_id, nickname').eq('id', userId).single(),
        AUTH_INIT_TIMEOUT_MS,
        'profile'
      );

      if (error) {
        console.error('[auth] profile load failed:', error.message);
        if (isJwtClockSkewError(error.message)) {
          await getSupabase().auth.signOut();
          setState({
            userId: null,
            email: null,
            role: null,
            storeId: null,
            nickname: null,
            loading: false,
            initError: formatSupabaseAuthError(error.message),
          });
          return;
        }
        setState({
          userId,
          email,
          role: null,
          storeId: null,
          nickname: null,
          loading: false,
          initError: null,
        });
        return;
      }

      setState({
        userId,
        email,
        role: data.role,
        storeId: data.store_id,
        nickname: data.nickname,
        loading: false,
        initError: null,
      });
    } catch (err) {
      console.error('[auth] profile load error:', err);
      setState({
        userId,
        email,
        role: null,
        storeId: null,
        nickname: null,
        loading: false,
        initError: '프로필을 불러오지 못했어요. 네트워크를 확인해 주세요.',
      });
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState((s) => ({
        ...s,
        loading: false,
        initError: 'Supabase 설정이 없습니다. apps/mobile/.env 를 확인하세요.',
      }));
      return;
    }

    let active = true;
    let cleanupAuth: (() => void) | undefined;

    const timer = setTimeout(() => {
      const sb = getSupabase();

      withTimeout(sb.auth.getSession(), AUTH_INIT_TIMEOUT_MS, 'session')
      .then(({ data }) => {
        if (!active) return;
        const user = data.session?.user;
        if (user) {
          loadProfile(user.id, user.email ?? null);
        } else {
          setState((s) => ({ ...s, loading: false, initError: null }));
        }
      })
      .catch((err) => {
        console.error('[auth] getSession failed:', err);
        if (active) {
          setState((s) => ({
            ...s,
            loading: false,
            initError: '로그인 상태 확인에 실패했어요. Wi‑Fi/데이터를 확인해 주세요.',
          }));
        }
      });

      const { data: subscription } = sb.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        if (user) {
          loadProfile(user.id, user.email ?? null);
        } else {
          setState({
            userId: null,
            email: null,
            role: null,
            storeId: null,
            nickname: null,
            loading: false,
            initError: null,
          });
        }
      });

      cleanupAuth = () => subscription.subscription.unsubscribe();
    }, 50);

    return () => {
      active = false;
      clearTimeout(timer);
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

  async function signInWithGoogle() {
    setState((s) => ({ ...s, loading: true, initError: null }));
    try {
      const { error, cancelled } = await signInWithGoogleOAuth();
      if (cancelled) {
        setState((s) => ({ ...s, loading: false }));
        return { error: null, ok: false };
      }
      if (error) {
        setState((s) => ({ ...s, loading: false }));
        return { error, ok: false };
      }
      const { data } = await getSupabase().auth.getSession();
      const user = data.session?.user;
      if (user) {
        await loadProfile(user.id, user.email ?? null);
        return { error: null, ok: true };
      }
      setState((s) => ({ ...s, loading: false }));
      return { error: null, ok: false };
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        initError: 'Google 로그인 요청에 실패했어요.',
      }));
      return { error: 'Google 로그인 요청에 실패했어요.', ok: false };
    }
  }

  async function signOut() {
    await getSupabase().auth.signOut();
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
