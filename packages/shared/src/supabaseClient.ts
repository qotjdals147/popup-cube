import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for browser/client-side use.
 * Pass the publishable (anon) key — never the service role key here.
 */
export function createSupabaseBrowserClient(
  url: string,
  anonKey: string
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
