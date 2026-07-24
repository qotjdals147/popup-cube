import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserRole } from '@popup-cube/shared';
import { supabase } from '../lib/supabase';

interface AuthState {
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  storeId: string | null;
  /** 게임 캐릭터 닉네임. 구버전 계정은 null일 수 있음 → 화면에서 email 앞부분으로 대체. */
  nickname: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  /** 회원가입 — nickname은 사전에 "중복확인"을 통과한 값이어야 함 (호출부에서 검증). */
  signUp: (
    email: string,
    password: string,
    nickname: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  /** profiles.role / store_id가 서버에서 바뀐 뒤(예: 매장 만들기) 다시 불러오기 (§26 P1) */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 쉬운 설명: 로그인한 사람이 "소비자"인지 "점주"인지(role)를 앱 전체에서
 * 알 수 있게 해 주는 곳. profiles 테이블의 role 컬럼을 읽어옵니다. (AD-013, §22)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    role: null,
    storeId: null,
    nickname: null,
    loading: true,
  });

  async function loadProfile(userId: string, email: string | null) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, store_id, nickname')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[auth] failed to load profile:', error.message);
      setState({ userId, email, role: null, storeId: null, nickname: null, loading: false });
      return;
    }

    setState({
      userId,
      email,
      role: data.role,
      storeId: data.store_id,
      nickname: data.nickname,
      loading: false,
    });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) {
        loadProfile(user.id, user.email ?? null);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        loadProfile(user.id, user.email ?? null);
      } else {
        setState({ userId: null, email: null, role: null, storeId: null, nickname: null, loading: false });
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signInWithPassword(email: string, password: string) {
    // 로그인 성공 → onAuthStateChange가 profiles를 다 읽어올 때까지 loading=true 유지.
    // (안 그러면 /home 이동 시 "아직 role 못 읽음"인 순간의 stale 상태로 다시 랜딩으로 튕겨나감 — ISS-014)
    setState((s) => ({ ...s, loading: true }));

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setState((s) => ({ ...s, loading: false }));
    }
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, nickname: string) {
    setState((s) => ({ ...s, loading: true }));

    // nickname은 auth.users.raw_user_meta_data에 실려서 handle_new_user 트리거가
    // profiles.nickname으로 그대로 복사함 (이메일 인증 여부와 무관하게 가입 시점에 바로 반영됨).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });

    if (error) {
      setState((s) => ({ ...s, loading: false }));
      return { error: error.message, needsEmailConfirmation: false };
    }

    const needsEmailConfirmation = !data.session;
    if (needsEmailConfirmation) {
      // 세션이 없으면(이메일 인증 필요) onAuthStateChange가 안 불려서 직접 loading을 내려줌.
      setState((s) => ({ ...s, loading: false }));
    }
    // 세션이 즉시 생기면(이메일 인증 불필요) onAuthStateChange → loadProfile이 이어서 처리.
    return { error: null, needsEmailConfirmation };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (!state.userId) return;
    await loadProfile(state.userId, state.email);
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithPassword, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
