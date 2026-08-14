/** WebView ↔ 앱 네이티브 하단탭 장바구니 뱃지 동기화 */
export const CART_STORAGE_KEY = 'popup_cube_cart_v1';

export function postCartCountToApp(count: number) {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'cart_updated', count }));
}

export function cartCountFromItems(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
