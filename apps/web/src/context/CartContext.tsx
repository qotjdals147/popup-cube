import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@popup-cube/shared';
import { CART_STORAGE_KEY, cartCountFromItems, postCartCountToApp } from '../lib/cartSync';

const STORAGE_KEY = CART_STORAGE_KEY;

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  addToCart: (storeId: string, product: Product, quantity?: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  removeItem: (productId: string) => void;
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
    postCartCountToApp(cartCountFromItems(items));
  }, [items]);

  function addToCart(storeId: string, product: Product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          storeId,
          name: product.name,
          price: product.price,
          imageUrl: product.image_url,
          quantity,
        },
      ];
    });
  }

  function incrementQuantity(productId: string) {
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }

  function decrementQuantity(productId: string) {
    setItems((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
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
