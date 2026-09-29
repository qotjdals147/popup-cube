import { getSupabase } from './supabase';

/** OAuth 등 nickname 없는 profiles — Google name·이메일 앞부분으로 server-side 설정 */
export async function ensureProfileNickname(): Promise<string | null> {
  const { data, error } = await getSupabase().rpc('ensure_profile_nickname');
  if (error) {
    console.warn('[profile] ensure_profile_nickname:', error.message);
    return null;
  }
  return typeof data === 'string' ? data : null;
}
