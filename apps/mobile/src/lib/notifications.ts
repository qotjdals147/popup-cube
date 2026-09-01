import { getSupabase } from './supabase';

export async function countUnreadNotifications(): Promise<number> {
  const { data, error } = await getSupabase().rpc('count_my_unread_notifications');
  if (error) throw new Error(error.message);
  return typeof data === 'number' ? data : 0;
}
