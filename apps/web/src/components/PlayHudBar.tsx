import type { ReactNode } from 'react';
import { t } from '../i18n';

export type PlayHudBarProps = {
  interactDisabled: boolean;
  interactActive: boolean;
  cartCount: number;
  onInteract: () => void;
  onChat: () => void;
  onCart: () => void;
  onShop: () => void;
  onMyOrders: () => void;
};

function PixelIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="play-hud-icon"
      viewBox="0 0 16 16"
      width={28}
      height={28}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function PlayHudBar({
  interactDisabled,
  interactActive,
  cartCount,
  onInteract,
  onChat,
  onCart,
  onShop,
  onMyOrders,
}: PlayHudBarProps) {
  return (
    <nav className="play-hud-bar" aria-label={t('play.hudBarLabel')}>
      <button
        type="button"
        className={`play-hud-slot${interactActive ? ' play-hud-slot-active' : ''}${
          interactDisabled ? ' play-hud-slot-disabled' : ''
        }`}
        disabled={interactDisabled}
        onClick={onInteract}
        title={
          interactActive
            ? t('display.interactNear')
            : t('display.interactHint')
        }
      >
        <PixelIcon>
          <rect x="2" y="6" width="12" height="8" fill="#c9a962" />
          <rect x="4" y="3" width="8" height="3" fill="#e8d5a3" />
          <rect x="7" y="8" width="2" height="2" fill="#0a0e1a" />
        </PixelIcon>
        <span className="play-hud-label">{t('store.hud.interact')}</span>
      </button>
      <button type="button" className="play-hud-slot" onClick={onChat}>
        <PixelIcon>
          <rect x="1" y="3" width="14" height="10" rx="1" fill="#5b8fd4" />
          <rect x="3" y="5" width="6" height="1" fill="#fff" />
          <rect x="3" y="7" width="10" height="1" fill="#dce8ff" />
          <rect x="3" y="9" width="8" height="1" fill="#dce8ff" />
        </PixelIcon>
        <span className="play-hud-label">{t('store.hud.chat')}</span>
      </button>
      <button type="button" className="play-hud-slot play-hud-slot-cart" onClick={onCart}>
        <PixelIcon>
          <rect x="2" y="4" width="12" height="9" fill="#e94560" />
          <rect x="4" y="2" width="8" height="2" fill="#ff8fa3" />
          <rect x="5" y="7" width="2" height="2" fill="#fff" />
          <rect x="9" y="7" width="2" height="2" fill="#fff" />
        </PixelIcon>
        <span className="play-hud-label">
          {t('store.hud.cart')}
          {cartCount > 0 ? ` ${cartCount}` : ''}
        </span>
      </button>
      <button type="button" className="play-hud-slot play-hud-slot-shop" onClick={onShop}>
        <PixelIcon>
          <rect x="2" y="2" width="12" height="12" fill="#2ecc71" />
          <rect x="4" y="4" width="3" height="3" fill="#fff" />
          <rect x="9" y="4" width="3" height="3" fill="#fff" />
          <rect x="4" y="9" width="8" height="2" fill="#a8f0c8" />
        </PixelIcon>
        <span className="play-hud-label">{t('store.hud.allProducts')}</span>
      </button>
      <button type="button" className="play-hud-slot" onClick={onMyOrders}>
        <PixelIcon>
          <rect x="2" y="2" width="12" height="12" fill="#0f3460" stroke="#c9a962" strokeWidth="1" />
          <rect x="4" y="5" width="8" height="1" fill="#c9a962" />
          <rect x="4" y="7" width="8" height="1" fill="#c9a962" />
          <rect x="4" y="9" width="5" height="1" fill="#c9a962" />
        </PixelIcon>
        <span className="play-hud-label">{t('store.hud.myOrders')}</span>
      </button>
    </nav>
  );
}
