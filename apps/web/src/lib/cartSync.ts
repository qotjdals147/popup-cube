/** WebView ↔ 앱 네이티브 — 하단탭 뱃지 + WebView 간 장바구니 동기화 */
export const CART_STORAGE_KEY = 'popup_cube_cart_v1';

export function postCartToApp(items: { quantity: number }[]) {
  if (!window.ReactNativeWebView) return;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: 'cart_updated',
      count: cartCountFromItems(items),
      items,
    }),
  );
}

/** @deprecated use postCartToApp */
export function postCartCountToApp(count: number) {
  if (!window.ReactNativeWebView) return;
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cart_updated', count }));
}

export function cartCountFromItems(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
