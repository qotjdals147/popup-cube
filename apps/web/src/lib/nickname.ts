import { supabase } from './supabase';

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

export function isNicknameLengthValid(nickname: string): boolean {
  const len = nickname.trim().length;
  return len >= NICKNAME_MIN_LENGTH && len <= NICKNAME_MAX_LENGTH;
}

/** DB의 is_nickname_available RPC 호출 — 대소문자 구분 없이 중복 체크 (RLS 우회, 존재 여부만 반환). */
export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_nickname_available', {
    p_nickname: nickname.trim(),
  });
  if (error) throw error;
  return Boolean(data);
}
