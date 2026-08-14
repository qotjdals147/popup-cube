import Constants from 'expo-constants';
import { getSupabase } from './supabase';

export type AccountWebTab = 'orders' | 'addresses';
export type AccountWebEmbed = 'panel' | 'page';

function readWebOrigin(): string {
  const extra = Constants.expoConfig?.extra as { webOrigin?: string } | undefined;
  const fromExtra = extra?.webOrigin?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, '');
  const fromEnv = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'https://popup-cube-web.vercel.app';
}

/** WebView `/app/me` URL (세션 hash 포함) */
export async function buildAccountWebViewUrl(
  tab: AccountWebTab,
  embed: AccountWebEmbed = 'page',
): Promise<string | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error || !data.session) return null;

  const origin = readWebOrigin();
  const query = new URLSearchParams({
    theme: 'light',
    tab,
    embed,
  }).toString();
  const hash = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  }).toString();

  return `${origin}/app/me?${query}#${hash}`;
}
