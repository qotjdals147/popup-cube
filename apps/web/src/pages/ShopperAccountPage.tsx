import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AddressManagementPanel } from '../components/AddressManagementPanel';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { OrderHistoryPanel } from '../components/OrderHistoryPanel';
import { supabase } from '../lib/supabase';
import { useShopperThemeMode } from '../lib/shopperThemeMode';
import { t } from '../i18n';
import '../styles/shopper-account.css';
import '../styles/shopper-account-panels.css';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
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
    console.error('[account] setSession failed:', error.message);
    return;
  }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function postToApp(type: string) {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type }));
}

type AccountTab = 'orders' | 'addresses' | 'notifications';

function readTabFromSearch(): AccountTab {
  const raw = new URLSearchParams(window.location.search).get('tab');
  if (raw === 'addresses') return 'addresses';
  if (raw === 'notifications') return 'notifications';
  return 'orders';
}

function readOrderIdFromSearch(): string | null {
  return new URLSearchParams(window.location.search).get('orderId');
}

function readEmbedFromSearch(): 'panel' | 'page' | null {
  const raw = new URLSearchParams(window.location.search).get('embed');
  if (raw === 'panel' || raw === 'page') return raw;
  return null;
}

/** 모바일 앱 WebView — 손님 「내 정보」(구매 내역 · 배송지) AD-030 · AD-054 */
export function ShopperAccountPage() {
  const { userId, nickname, email, loading: authLoading } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [tab, setTab] = useState<AccountTab>(() => readTabFromSearch());
  const [openOrderId, setOpenOrderId] = useState<string | null>(() => readOrderIdFromSearch());
  const theme = useShopperThemeMode();
  const embed = useMemo(() => readEmbedFromSearch(), []);

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

  const displayName = nickname ?? email?.split('@')[0] ?? t('common.guest');

  if (bootstrapping || authLoading) {
    return (
      <div className="shopper-account-page" data-theme={theme}>
        <p className="shopper-account-status">{t('shopperAccount.loading')}</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="shopper-account-page" data-theme={theme}>
        <p className="shopper-account-status">{t('play.needLogin')}</p>
        <button type="button" className="shopper-account-back" onClick={goHome}>
          {t('play.backHome')}
        </button>
      </div>
    );
  }

  const inApp = typeof window !== 'undefined' && !!window.ReactNativeWebView;
  /** 앱 WebView = 화면당 한 기능만 (주문 OR 배송지). 탭 UI는 브라우저 `/app/me` 전용 */
  const singlePanel = embed === 'panel' || inApp;

  if (singlePanel) {
    return (
      <div className="shopper-account-page shopper-account-page--embed-panel" data-theme={theme}>
        <main className="shopper-account-main">
          {tab === 'orders' && (
            <OrderHistoryPanel embedded appearance={theme} initialOrderId={openOrderId} />
          )}
          {tab === 'addresses' && <AddressManagementPanel appearance={theme} embedded />}
          {tab === 'notifications' && <NotificationsPanel embedded appearance={theme} />}
        </main>
      </div>
    );
  }

  return (
    <div className="shopper-account-page" data-theme={theme}>
      <header className={`shopper-account-header${inApp ? ' shopper-account-header--app' : ''}`}>
        {!inApp && (
          <button type="button" className="shopper-account-back" onClick={goHome}>
            {t('play.backHome')}
          </button>
        )}
        <div className="shopper-account-header-text">
          <h1 className="shopper-account-title">{t('shopperAccount.title')}</h1>
          <p className="shopper-account-subtitle">{displayName}</p>
        </div>
      </header>

      <nav className="shopper-account-tabs" aria-label={t('shopperAccount.tabsLabel')}>
        <button
          type="button"
          className={`shopper-account-tab shopper-account-tab--orders${tab === 'orders' ? ' shopper-account-tab-active' : ''}`}
          onClick={() => setTab('orders')}
        >
          {t('shopperAccount.tabOrders')}
        </button>
        <button
          type="button"
          className={`shopper-account-tab shopper-account-tab--addresses${tab === 'addresses' ? ' shopper-account-tab-active' : ''}`}
          onClick={() => setTab('addresses')}
        >
          {t('shopperAccount.tabAddresses')}
        </button>
        <button
          type="button"
          className={`shopper-account-tab shopper-account-tab--notifications${tab === 'notifications' ? ' shopper-account-tab-active' : ''}`}
          onClick={() => setTab('notifications')}
        >
          {t('shopperAccount.tabNotifications')}
        </button>
      </nav>

      <main className="shopper-account-main">
        {tab === 'orders' && (
          <OrderHistoryPanel embedded appearance={theme} initialOrderId={openOrderId} />
        )}
        {tab === 'addresses' && <AddressManagementPanel appearance={theme} embedded />}
        {tab === 'notifications' && <NotificationsPanel embedded appearance={theme} />}
      </main>
    </div>
  );
}
