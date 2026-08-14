declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

export function postToApp(type: string, payload?: Record<string, unknown>) {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type, ...payload }));
}
