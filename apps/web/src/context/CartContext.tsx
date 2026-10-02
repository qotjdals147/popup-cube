import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@popup-cube/shared';
import { CART_STORAGE_KEY, postCartToApp } from '../lib/cartSync';
import { cartLineKey } from '../lib/cartLineKey';

const STORAGE_KEY = CART_STORAGE_KEY;

export interface AddToCartOption {
  skuId: string;
  optionLabel: string;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  addToCart: (storeId: string, product: Product, quantity?: number, option?: AddToCartOption) => void;
  incrementQuantity: (lineKey: string) => void;
  decrementQuantity: (lineKey: string) => void;
  removeItem: (lineKey: string) => void;
  /** 결제 완료된 product_id만 제거 (레거시 · 옵션 라인 오삭제 — ISS-050) */
  removeItemsByProductIds: (productIds: string[]) => void;
  /** 결제 완료된 cartLineKey 라인만 제거 (옵션 SKU 구분) */
  removeItemsByLineKeys: (lineKeys: string[]) => void;
  clearCart: () => void;
  /** 매장별 결제 완료 시 — 해당 매장 품목만 제거 (§60 v1) */
  clearStoreItems: (storeId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 쉬운 설명: 장바구니 MVP(§10) — 아직 DB에 저장하지 않고, 이 브라우저 안에만 담아두는
 * "장바구니 상태 보관함"입니다. 결제는 mock(가짜)이라 실제 주문 테이블은 없어요.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadFromStorage());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    postCartToApp(items);
  }, [items]);

  useEffect(() => {
    function syncFromNativeBridge() {
      setItems(loadFromStorage());
    }
    window.addEventListener('popup_cart_hydrate', syncFromNativeBridge);
    return () => window.removeEventListener('popup_cart_hydrate', syncFromNativeBridge);
  }, []);

  function addToCart(storeId: string, product: Product, quantity = 1, option?: AddToCartOption) {
    const lineStoreId = product.store_id || storeId;
    const skuId = option?.skuId ?? null;
    const optionLabel = option?.optionLabel ?? null;
    setItems((prev) => {
      const key = cartLineKey({ productId: product.id, skuId });
      const existing = prev.find((item) => cartLineKey(item) === key);
      if (existing) {
        return prev.map((item) =>
          cartLineKey(item) === key
            ? { ...item, quantity: item.quantity + quantity, storeId: lineStoreId }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          storeId: lineStoreId,
          name: product.name,
          price: product.price,
          imageUrl: product.image_url,
          quantity,
          skuId,
          optionLabel,
        },
      ];
    });
  }

  function incrementQuantity(lineKey: string) {
    setItems((prev) =>
      prev.map((item) =>
        cartLineKey(item) === lineKey ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function decrementQuantity(lineKey: string) {
    setItems((prev) =>
      prev
        .map((item) =>
          cartLineKey(item) === lineKey ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(lineKey: string) {
    setItems((prev) => prev.filter((item) => cartLineKey(item) !== lineKey));
  }

  function removeItemsByProductIds(productIds: string[]) {
    if (productIds.length === 0) return;
    const drop = new Set(productIds);
    setItems((prev) => prev.filter((item) => !drop.has(item.productId)));
  }

  function removeItemsByLineKeys(lineKeys: string[]) {
    if (lineKeys.length === 0) return;
    const drop = new Set(lineKeys);
    setItems((prev) => prev.filter((item) => !drop.has(cartLineKey(item))));
  }

  function clearCart() {
    setItems([]);
  }

  function clearStoreItems(storeId: string) {
    setItems((prev) => prev.filter((item) => item.storeId !== storeId));
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        totalPrice,
        addToCart,
        incrementQuantity,
        decrementQuantity,
        removeItem,
        removeItemsByProductIds,
        removeItemsByLineKeys,
        clearCart,
        clearStoreItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
