import Constants from 'expo-constants';
import { getSupabase } from './supabase';

function readWebOrigin(): string {
  const extra = Constants.expoConfig?.extra as { webOrigin?: string } | undefined;
  const fromExtra = extra?.webOrigin?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, '');
  const fromEnv = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'https://popup-cube-web.vercel.app';
}

/** WebView `/app/cart` URL (세션 hash 포함) */
export async function buildCartWebViewUrl(): Promise<string | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error || !data.session) return null;

  const origin = readWebOrigin();
  const query = new URLSearchParams({ theme: 'light' }).toString();
  const hash = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  }).toString();

  return `${origin}/app/cart?${query}#${hash}`;
}

/** WebView 로드 시 localStorage 장바구니 수량 → 앱 뱃지 동기화 */
export const CART_COUNT_INJECT_SCRIPT = `
(function() {
  try {
    var raw = localStorage.getItem('popup_cube_cart_v1');
    var items = raw ? JSON.parse(raw) : [];
    var count = items.reduce(function(s, i) { return s + (i.quantity || 0); }, 0);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cart_updated', count: count }));
    }
  } catch (e) {}
})();
true;
`;
