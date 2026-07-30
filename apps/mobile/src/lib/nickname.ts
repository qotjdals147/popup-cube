import { getSupabase } from './supabase';

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

export function isNicknameLengthValid(nickname: string): boolean {
  const len = nickname.trim().length;
  return len >= NICKNAME_MIN_LENGTH && len <= NICKNAME_MAX_LENGTH;
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('is_nickname_available', {
    p_nickname: nickname.trim(),
  });
  if (error) throw error;
  return Boolean(data);
}
