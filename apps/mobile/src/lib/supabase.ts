import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

function readExtra(): SupabaseExtra {
  const root = Constants.expoConfig?.extra as SupabaseExtra | undefined;
  return {
    supabaseUrl: root?.supabaseUrl?.trim(),
    supabaseAnonKey: root?.supabaseAnonKey?.trim(),
  };
}

function readSupabaseConfig() {
  const extra = readExtra();
  const url = (extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readSupabaseConfig();
  return Boolean(url && anonKey.length > 20);
}

let client: SupabaseClient | null = null;
let clientFingerprint = '';

export function getSupabase(): SupabaseClient {
  const { url, anonKey } = readSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error('Supabase 설정이 비어 있습니다. apps/mobile/.env 확인 후 expo --clear 재시작하세요.');
  }

  const fingerprint = `${url}|${anonKey.length}|${anonKey.slice(-8)}`;
  if (!client || clientFingerprint !== fingerprint) {
    client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    clientFingerprint = fingerprint;
  }

  return client;
}

export function formatSupabaseAuthError(message: string): string {
  if (/invalid api key/i.test(message)) {
    return 'Supabase API 키 오류입니다. PC에서 Expo를 --clear 로 재시작한 뒤 QR을 다시 스캔해 주세요.';
  }
  if (/invalid login credentials/i.test(message)) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (/jwt issued at future|issued at future|clock skew/i.test(message)) {
    return '기기 시간이 서버와 맞지 않아요. 설정 → 날짜·시간 → 「자동 설정」 켠 뒤 앱을 완전히 종료하고 다시 로그인해 주세요.';
  }
  return message;
}

/** JWT 시계 오류 — 에뮬레이터·기기 시간이 틀릴 때 profiles REST가 거부함 */
export function isJwtClockSkewError(message: string): boolean {
  return /jwt issued at future|issued at future|clock skew/i.test(message);
}
