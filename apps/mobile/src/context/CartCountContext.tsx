import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';

const CART_COUNT_KEY = '@popup_cart_count';
const CART_ITEMS_KEY = '@popup_cart_items';

interface CartCountContextValue {
  count: number;
  /** `popup_cube_cart_v1` JSON — WebView localStorage 주입용 */
  itemsJson: string;
  bridgeReady: boolean;
  handleWebViewMessage: (event: WebViewMessageEvent) => void;
}

const CartCountContext = createContext<CartCountContextValue | null>(null);

/** 앱 하단탭 🛒 뱃지 + WebView 간 장바구니 본문 동기화 (localStorage는 WebView마다 분리됨) */
export function CartCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [itemsJson, setItemsJson] = useState('[]');
  const [bridgeReady, setBridgeReady] = useState(false);

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(CART_COUNT_KEY), AsyncStorage.getItem(CART_ITEMS_KEY)]).then(
      ([countRaw, itemsRaw]) => {
        const n = countRaw ? Number.parseInt(countRaw, 10) : 0;
        if (Number.isFinite(n) && n >= 0) setCount(n);
        if (itemsRaw) setItemsJson(itemsRaw);
        setBridgeReady(true);
      },
    );
  }, []);

  const persist = useCallback((nextCount: number, nextItemsJson: string) => {
    setCount(nextCount);
    setItemsJson(nextItemsJson);
    void AsyncStorage.multiSet([
      [CART_COUNT_KEY, String(nextCount)],
      [CART_ITEMS_KEY, nextItemsJson],
    ]);
  }, []);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          count?: number;
          items?: { quantity?: number }[];
        };
        if (msg.type !== 'cart_updated') return;

        const nextItemsJson = Array.isArray(msg.items) ? JSON.stringify(msg.items) : null;
        if (!nextItemsJson) {
          if (typeof msg.count === 'number') {
            persist(msg.count, itemsJson);
          }
          return;
        }

        const nextCount =
          typeof msg.count === 'number'
            ? msg.count
            : msg.items!.reduce((s, row) => s + (row.quantity ?? 0), 0);
        persist(nextCount, nextItemsJson);
      } catch {
        // ignore
      }
    },
    [itemsJson, persist],
  );

  return (
    <CartCountContext.Provider value={{ count, itemsJson, bridgeReady, handleWebViewMessage }}>
      {children}
    </CartCountContext.Provider>
  );
}

export function useCartCount() {
  const ctx = useContext(CartCountContext);
  if (!ctx) throw new Error('useCartCount must be used within CartCountProvider');
  return ctx;
}
