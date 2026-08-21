import { CartView } from './CartView';

interface CartDrawerProps {
  storeId: string;
  userId: string | null;
  onClose: () => void;
  appearance?: 'light' | 'dark';
}

/** 매장 쇼핑 중 장바구니 — 홈 장바구니 탭과 동일한 CartView(localStorage) */
export function CartDrawer({ storeId, userId, onClose, appearance = 'light' }: CartDrawerProps) {
  return <CartView userId={userId} storeId={storeId} layout="drawer" appearance={appearance} onClose={onClose} />;
}
