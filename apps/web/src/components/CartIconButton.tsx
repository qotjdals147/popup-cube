import { t } from '../i18n';
import { ShopperLineIcon } from './ShopperLineIcon';
import '../styles/cart-icon-button.css';

interface CartIconButtonProps {
  count: number;
  onClick: () => void;
  className?: string;
  /** icon-only square button (product detail bar) vs header icon */
  variant?: 'header' | 'bar';
}

/** 손님 UI 공통 — 라인 장바구니 + 수량 뱃지 (§7.112) */
export function CartIconButton({ count, onClick, className = '', variant = 'header' }: CartIconButtonProps) {
  const rootClass = ['cart-icon-btn', `cart-icon-btn--${variant}`, className].filter(Boolean).join(' ');

  return (
    <button type="button" className={rootClass} onClick={onClick} aria-label={t('storeShop.cartLabel')}>
      <ShopperLineIcon name="bag" size={variant === 'bar' ? 22 : 24} className="cart-icon-btn__glyph" />
      {count > 0 && (
        <span className="cart-icon-btn__badge" aria-hidden>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
