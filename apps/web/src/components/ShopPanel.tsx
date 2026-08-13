import { useCart } from '../context/CartContext';
import { StoreShopCatalog } from './StoreShopCatalog';
import { t } from '../i18n';
import '../styles/store-shop.css';

interface ShopPanelProps {
  storeId: string;
  onClose: () => void;
  onOpenCart: () => void;
}

/** 쉬운 설명: 「전체 상품」버튼을 누르면 열리는, 이 매장의 전체 상품 목록 창. (장바구니와 다름) */
export function ShopPanel({ storeId, onClose, onOpenCart }: ShopPanelProps) {
  const { totalQuantity } = useCart();

  return (
    <div className="shop-panel-overlay" onClick={onClose}>
      <div className="shop-panel" onClick={(e) => e.stopPropagation()}>
        <div className="shop-panel__header">
          <h3 className="shop-panel__title">{t('shop.title')}</h3>
          <div className="shop-panel__header-actions">
            <button type="button" className="shop-panel__cart-btn" onClick={onOpenCart}>
              🛒 {t('shop.cart')} {totalQuantity > 0 ? `(${totalQuantity})` : ''}
            </button>
            <button type="button" className="shop-panel__close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <StoreShopCatalog storeId={storeId} variant="overlay" onOpenCart={onOpenCart} />
      </div>
    </div>
  );
}
