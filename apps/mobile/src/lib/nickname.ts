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

/** 닉네임 변경 — 현재 닉네임과 같으면 사용 가능으로 간주 */
export async function checkNicknameAvailableForChange(
  nickname: string,
  currentNickname: string | null | undefined,
): Promise<boolean> {
  const trimmed = nickname.trim();
  const current = currentNickname?.trim();
  if (current && trimmed.toLowerCase() === current.toLowerCase()) {
    return true;
  }
  return checkNicknameAvailable(trimmed);
}

export class NicknameUpdateError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function updateMyNickname(nickname: string): Promise<string> {
  const { data, error } = await getSupabase().rpc('update_my_nickname', {
    p_nickname: nickname.trim(),
  });
  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('invalid_length')) throw new NicknameUpdateError('invalid_length');
    if (msg.includes('nickname_taken')) throw new NicknameUpdateError('nickname_taken');
    throw new NicknameUpdateError('unknown');
  }
  return String(data);
}
