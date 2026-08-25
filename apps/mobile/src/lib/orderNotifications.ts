import { getSupabase } from './supabase';

export async function registerPushToken(expoPushToken: string): Promise<void> {
  const { error } = await getSupabase().rpc('register_push_token', {
    p_expo_push_token: expoPushToken,
  });
  if (error) throw new Error(error.message);
}
