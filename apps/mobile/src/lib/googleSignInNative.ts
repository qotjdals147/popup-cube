import Constants from 'expo-constants';
import { formatSupabaseAuthError, getSupabase } from './supabase';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let cached: GoogleSigninModule | null | undefined;

/** Expo Go에는 네이티브 모듈이 없음 — require 실패를 안전하게 흡수 */
function loadGoogleSignin(): GoogleSigninModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cached = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
    cached = null;
  }
  return cached;
}

function isExpoGoRuntime(): boolean {
  return Constants.appOwnership === 'expo';
}

/** JS 패키지는 Expo Go에도 있지만 RNGoogleSignin 네이티브는 Dev Client 빌드에만 있음 */
function isNativeGoogleModuleLinked(): boolean {
  try {
    const { TurboModuleRegistry } = require('react-native') as typeof import('react-native');
    const get = TurboModuleRegistry.get;
    if (typeof get === 'function' && get('RNGoogleSignin') != null) {
      return true;
    }
  } catch {
    // ignore
  }
  try {
    const { NativeModules } = require('react-native') as typeof import('react-native');
    return NativeModules.RNGoogleSignin != null;
  } catch {
    return false;
  }
}

export function isNativeGoogleSignInAvailable(): boolean {
  if (isExpoGoRuntime()) return false;
  if (loadGoogleSignin() === null) return false;
  return isNativeGoogleModuleLinked();
}

function getWebClientId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined;
  return extra?.googleWebClientId?.trim() || undefined;
}

let configured = false;

function ensureConfigured(mod: GoogleSigninModule): { ok: boolean; error?: string } {
  if (configured) return { ok: true };
  const webClientId = getWebClientId();
  if (!webClientId) {
    return {
      ok: false,
      error: 'Google 웹 클라이언트 ID가 설정되지 않았어요. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 확인하세요.',
    };
  }
  mod.GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
  return { ok: true };
}

/**
 * §7.82 — 네이티브 Google 로그인 (Credential Manager / Google Play Services)
 * Expo Go에서는 동작하지 않음 (EAS Dev Client 필요) — ISS-040/041 브라우저 리다이렉트 문제를
 * 구조적으로 회피 (accounts.google.com 무한로딩 · Gmail 작성화면 오탈출 없음).
 */
export async function signInWithGoogleNative(): Promise<{ error: string | null; cancelled?: boolean }> {
  const mod = loadGoogleSignin();
  if (!mod) {
    return { error: 'native-unavailable' };
  }

  const configResult = ensureConfigured(mod);
  if (!configResult.ok) {
    return { error: configResult.error ?? 'Google 로그인 설정 오류입니다.' };
  }

  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { error: null, cancelled: true };
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      return { error: 'Google 로그인 응답에 토큰이 없어요.' };
    }

    const { error } = await getSupabase().auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return { error: formatSupabaseAuthError(error.message) };
    }
    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('RNGoogleSignin') || msg.includes('TurboModuleRegistry')) {
      return { error: 'native-unavailable' };
    }
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: null, cancelled: true };
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        return { error: 'Google 로그인이 이미 진행 중이에요.' };
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Google Play 서비스를 사용할 수 없어요.' };
      }
    }
    console.error('[auth] native google sign-in error:', err);
    return { error: 'Google 로그인 요청에 실패했어요.' };
  }
}

export async function signOutGoogleNative(): Promise<void> {
  const mod = loadGoogleSignin();
  if (!mod) return;
  try {
    await mod.GoogleSignin.signOut();
  } catch {
    // no-op
  }
}
