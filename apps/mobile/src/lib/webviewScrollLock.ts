import type { WebViewMessageEvent } from 'react-native-webview';

/** WebView `webview_scroll_lock` postMessage → RN WebView scrollEnabled */
export function parseWebViewScrollLockMessage(event: WebViewMessageEvent): boolean | null {
  try {
    const msg = JSON.parse(event.nativeEvent.data) as { type?: string; locked?: boolean };
    if (msg.type !== 'webview_scroll_lock') return null;
    return Boolean(msg.locked);
  } catch {
    return null;
  }
}
