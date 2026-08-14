import { useEffect, useState } from 'react';

export type ShopperThemeMode = 'light' | 'dark';

export function readThemeFromSearch(): ShopperThemeMode {
  const raw = new URLSearchParams(window.location.search).get('theme');
  return raw === 'dark' ? 'dark' : 'light';
}

function parseThemeMessage(data: unknown): ShopperThemeMode | null {
  if (!data || typeof data !== 'object') return null;
  const msg = data as { type?: string; theme?: string };
  if (msg.type !== 'set_theme') return null;
  return msg.theme === 'dark' ? 'dark' : msg.theme === 'light' ? 'light' : null;
}

/** URL ?theme= + 앱 WebView postMessage(`set_theme`) 동기화 */
export function useShopperThemeMode(): ShopperThemeMode {
  const [theme, setTheme] = useState<ShopperThemeMode>(() => readThemeFromSearch());

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      try {
        const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const next = parseThemeMessage(parsed);
        if (next) setTheme(next);
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', onMessage);
    document.addEventListener('message', onMessage as EventListener);
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('message', onMessage as EventListener);
    };
  }, []);

  return theme;
}
