import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CartDrawer } from '../components/CartDrawer';
import { StoreShopCatalog } from '../components/StoreShopCatalog';
import { getStoreSummary } from '../lib/stores';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';
import '../styles/store-shop.css';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

type ShopTheme = 'light' | 'dark';

function readThemeFromSearch(): ShopTheme {
  const raw = new URLSearchParams(window.location.search).get('theme');
  return raw === 'dark' ? 'dark' : 'light';
}

async function bootstrapSessionFromHash(): Promise<void> {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return;
  const params = new URLSearchParams(raw);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return;

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    console.error('[shop] setSession failed:', error.message);
    return;
  }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function postToApp(type: string) {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type }));
}

/**
 * v1 손님 쇼핑몰 — 모바일 WebView `/store/:storeId/shop` (AD-062 · §58 · §60).
 */
export function StoreShopPage() {
  const { storeId } = useParams();
  const { userId, loading: authLoading } = useAuth();
  const { totalQuantity } = useCart();

  const theme = useMemo(() => readThemeFromSearch(), []);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeError, setStoreError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let active = true;
    bootstrapSessionFromHash().finally(() => {
      if (active) setBootstrapping(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    setStoreError(false);
    getStoreSummary(storeId)
      .then((summary) => {
        if (!active) return;
        setStoreName(summary?.name ?? null);
        if (!summary) setStoreError(true);
      })
      .catch(() => {
        if (active) setStoreError(true);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  function goHome() {
    postToApp('navigate_home');
    if (!window.ReactNativeWebView) {
      window.location.href = '/app-only';
    }
  }

  function openCart() {
    setCartOpen(true);
  }

  const pageClass = 'store-shop-page';

  if (bootstrapping || authLoading) {
    return (
      <div className={pageClass} data-theme={theme}>
        <p className="store-shop-status">{t('storeShop.loading')}</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={pageClass} data-theme={theme}>
        <p className="store-shop-status">{t('play.needLogin')}</p>
        <button type="button" className="store-shop-back" style={{ margin: '0 auto 24px' }} onClick={goHome}>
          {t('storeShop.backHome')}
        </button>
      </div>
    );
  }

  if (!storeId || storeError) {
    return (
      <div className={pageClass} data-theme={theme}>
        <p className="store-shop-status">{t('storeShop.notFound')}</p>
        <button type="button" className="store-shop-back" style={{ margin: '0 auto 24px' }} onClick={goHome}>
          {t('storeShop.backHome')}
        </button>
      </div>
    );
  }

  return (
    <div className={pageClass} data-theme={theme}>
      <header className="store-shop-header">
        <div className="store-shop-header__toolbar">
          <button
            type="button"
            className="store-shop-icon-btn"
            onClick={goHome}
            aria-label={t('storeShop.backHomeLabel')}
          >
            ←
          </button>
          <button
            type="button"
            className="store-shop-icon-btn store-shop-icon-btn--cart"
            onClick={openCart}
            aria-label={t('storeShop.cartLabel')}
          >
            🛒
            {totalQuantity > 0 && (
              <span className="store-shop-icon-btn__badge">{totalQuantity > 99 ? '99+' : totalQuantity}</span>
            )}
          </button>
        </div>
        <div className="store-shop-header__title-block">
          <h1 className="store-shop-title">{storeName ?? t('storeShop.loading')}</h1>
          <p className="store-shop-subtitle">{t('storeShop.subtitle')}</p>
        </div>
      </header>

      <main className="store-shop-main">
        <StoreShopCatalog storeId={storeId} variant="page" onOpenCart={openCart} />
      </main>

      <div className="store-shop-sticky-bar">
        <button
          type="button"
          className="store-shop-sticky-bar__btn"
          onClick={openCart}
          disabled={totalQuantity === 0}
        >
          {totalQuantity > 0
            ? t('storeShop.cartBar', { count: totalQuantity })
            : t('storeShop.cartBarEmpty')}
        </button>
      </div>

      {cartOpen && (
        <CartDrawer
          storeId={storeId}
          userId={userId}
          appearance="light"
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
