import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CartView } from '../components/CartView';
import { postToApp } from '../lib/appBridge';
import { useShopperThemeMode } from '../lib/shopperThemeMode';
import { t } from '../i18n';
import '../styles/shopper-cart-page.css';

async function bootstrapSessionFromHash(): Promise<void> {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return;
  const params = new URLSearchParams(raw);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return;

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    console.error('[cart] setSession failed:', error.message);
    return;
  }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function readInsetTopFromSearch(): number {
  const raw = new URLSearchParams(window.location.search).get('insetTop');
  const n = raw ? Number.parseInt(raw, 10) : 0;
  if (Number.isFinite(n) && n > 0) return n;
  if (typeof window !== 'undefined' && window.ReactNativeWebView) return 28;
  return 0;
}

/**
 * 앱 하단 「장바구니」탭 WebView — localStorage 장바구니 전체 · 매장별 결제.
 */
export function ShopperCartPage() {
  const { userId, loading: authLoading } = useAuth();
  const { totalQuantity } = useCart();
  const theme = useShopperThemeMode();
  const [bootstrapping, setBootstrapping] = useState(true);
  const insetTop = readInsetTopFromSearch();

  useEffect(() => {
    document.documentElement.style.setProperty('--shop-inset-top', `${insetTop}px`);
  }, [insetTop]);

  useEffect(() => {
    let active = true;
    bootstrapSessionFromHash().finally(() => {
      if (active) setBootstrapping(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function goHome() {
    postToApp('navigate_home');
    if (!window.ReactNativeWebView) {
      window.location.href = '/app-only';
    }
  }

  if (bootstrapping || authLoading) {
    return (
      <div className="shopper-cart-page" data-theme={theme}>
        <p className="shopper-cart-page__status">{t('storeShop.loading')}</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="shopper-cart-page" data-theme={theme}>
        <p className="shopper-cart-page__status">{t('play.needLogin')}</p>
        <button type="button" className="shopper-cart-page__back" onClick={goHome}>
          {t('storeShop.backHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="shopper-cart-page" data-theme={theme}>
      <header className="shopper-cart-page__header">
        <button type="button" className="shopper-cart-page__back-btn" onClick={goHome} aria-label={t('storeShop.backHomeLabel')}>
          ←
        </button>
        <h1 className="shopper-cart-page__title">{t('cart.title')}</h1>
        {totalQuantity > 0 && <span className="shopper-cart-page__count">{totalQuantity}</span>}
      </header>
      <main className="shopper-cart-page__main">
        <CartView userId={userId} layout="page" appearance={theme} />
      </main>
    </div>
  );
}
