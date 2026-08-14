import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';

const CART_COUNT_KEY = '@popup_cart_count';

interface CartCountContextValue {
  count: number;
  handleWebViewMessage: (event: WebViewMessageEvent) => void;
}

const CartCountContext = createContext<CartCountContextValue | null>(null);

/** 앱 하단탭 🛒 뱃지 — WebView localStorage 장바구니와 동기화 */
export function CartCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    void AsyncStorage.getItem(CART_COUNT_KEY).then((raw) => {
      const n = raw ? Number.parseInt(raw, 10) : 0;
      if (Number.isFinite(n) && n >= 0) setCount(n);
    });
  }, []);

  const persistCount = useCallback((next: number) => {
    setCount(next);
    void AsyncStorage.setItem(CART_COUNT_KEY, String(next));
  }, []);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as { type?: string; count?: number };
        if (msg.type === 'cart_updated' && typeof msg.count === 'number') {
          persistCount(msg.count);
        }
      } catch {
        // ignore
      }
    },
    [persistCount],
  );

  return (
    <CartCountContext.Provider value={{ count, handleWebViewMessage }}>{children}</CartCountContext.Provider>
  );
}

export function useCartCount() {
  const ctx = useContext(CartCountContext);
  if (!ctx) throw new Error('useCartCount must be used within CartCountProvider');
  return ctx;
}
