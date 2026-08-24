import Constants from 'expo-constants';
import { getSupabase } from './supabase';

export const CART_STORAGE_KEY = 'popup_cube_cart_v1';

function readWebOrigin(): string {
  const extra = Constants.expoConfig?.extra as { webOrigin?: string } | undefined;
  const fromExtra = extra?.webOrigin?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, '');
  const fromEnv = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'https://popup-cube-web.vercel.app';
}

/** WebView `/app/cart` URL (세션 hash 포함) */
export async function buildCartWebViewUrl(theme: 'light' | 'dark' = 'light'): Promise<string | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error || !data.session) return null;

  const origin = readWebOrigin();
  const query = new URLSearchParams({ theme }).toString();
  const hash = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  }).toString();

  return `${origin}/app/cart?${query}#${hash}`;
}

/** 네이티브에 저장된 장바구니 → WebView localStorage (페이지/React 로드 전) */
export function buildCartHydrateScript(itemsJson: string): string {
  if (!itemsJson || itemsJson === '[]') return 'true;';
  const payload = JSON.stringify(itemsJson);
  return `(function(){try{var raw=${payload};if(raw)localStorage.setItem('${CART_STORAGE_KEY}',raw);}catch(e){}})();true;`;
}

/** localStorage 반영 후 React CartContext 리로드 (탭 포커스·이미 마운트된 WebView) */
export function buildCartHydrateAndNotifyScript(itemsJson: string): string {
  if (!itemsJson || itemsJson === '[]') {
    return `(function(){try{localStorage.removeItem('${CART_STORAGE_KEY}');window.dispatchEvent(new Event('popup_cart_hydrate'));}catch(e){}})();true;`;
  }
  const payload = JSON.stringify(itemsJson);
  return `(function(){try{var raw=${payload};if(raw){localStorage.setItem('${CART_STORAGE_KEY}',raw);window.dispatchEvent(new Event('popup_cart_hydrate'));}}catch(e){}})();true;`;
}

/** WebView 로드 후 localStorage → 앱 뱃지·본문 동기화 */
export const CART_COUNT_INJECT_SCRIPT = `
(function() {
  try {
    var raw = localStorage.getItem('${CART_STORAGE_KEY}');
    var items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) items = [];
    var count = items.reduce(function(s, i) { return s + (i.quantity || 0); }, 0);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cart_updated', count: count, items: items }));
    }
  } catch (e) {}
})();
true;
`;
