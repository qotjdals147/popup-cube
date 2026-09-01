import { useCallback, useEffect, useState } from 'react';
import type { ShopperNotificationView } from '@popup-cube/shared';
import { formatOrderRef } from '../lib/orderRef';
import { formatOrderDateTime } from '../lib/shopperOrderListUtils';
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/notifications';
import { useShopperNotificationRealtime } from '../hooks/useShopperNotificationRealtime';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

interface NotificationsPanelProps {
  embedded?: boolean;
  appearance?: 'light' | 'dark';
}

function postOpenOrder(orderId: string) {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'navigate_order', orderId }));
}

/** AD-076 — 손님 알림 목록 (쿠팡·배민형) */
export function NotificationsPanel({ embedded = false, appearance = 'light' }: NotificationsPanelProps) {
  const { userId } = useAuth();
  const useAccountTokens = appearance === 'light' || embedded;
  const { refreshTick, bumpRefresh } = useShopperNotificationRealtime(userId);
  const [items, setItems] = useState<ShopperNotificationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await listMyNotifications());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshTick]);

  async function handleOpen(item: ShopperNotificationView) {
    setActionId(item.id);
    try {
      if (!item.read_at) {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, read_at: new Date().toISOString() } : row)),
        );
        bumpRefresh();
      }
      if (item.order_id) {
        postOpenOrder(item.order_id);
        if (!window.ReactNativeWebView) {
          const url = new URL(window.location.href);
          url.searchParams.set('tab', 'orders');
          url.searchParams.set('orderId', item.order_id);
          window.location.assign(url.toString());
        }
      }
    } catch {
      setError(true);
    } finally {
      setActionId(null);
    }
  }

  async function handleMarkAllRead() {
    setActionId('all');
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((row) => ({ ...row, read_at: row.read_at ?? new Date().toISOString() })));
      bumpRefresh();
    } catch {
      setError(true);
    } finally {
      setActionId(null);
    }
  }

  const hasUnread = items.some((item) => !item.read_at);

  return (
    <div className={useAccountTokens ? 'oh-notifications' : undefined}>
      {useAccountTokens && hasUnread && (
        <div className="oh-notifications-toolbar">
          <button
            type="button"
            className="oh-notifications-mark-all"
            disabled={actionId === 'all'}
            onClick={() => void handleMarkAllRead()}
          >
            {t('notifications.markAllRead')}
          </button>
        </div>
      )}

      {loading && <p className={useAccountTokens ? 'oh-hint' : undefined}>{t('notifications.loading')}</p>}
      {!loading && error && <p className={useAccountTokens ? 'oh-error' : undefined}>{t('notifications.errorLoad')}</p>}
      {!loading && !error && items.length === 0 && (
        <p className={useAccountTokens ? 'oh-hint' : undefined}>{t('notifications.empty')}</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className={useAccountTokens ? 'oh-notification-list' : undefined}>
          {items.map((item) => {
            const unread = !item.read_at;
            const orderRef =
              item.store_code && item.order_number != null
                ? formatOrderRef(item.store_code, item.order_number)
                : null;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`oh-notification-row${unread ? ' oh-notification-row--unread' : ''}`}
                  disabled={actionId === item.id}
                  onClick={() => void handleOpen(item)}
                >
                  <div className="oh-notification-head">
                    <span className="oh-notification-title">{item.title}</span>
                    <time className="oh-notification-time" dateTime={item.created_at}>
                      {formatOrderDateTime(item.created_at)}
                    </time>
                  </div>
                  <p className="oh-notification-body">{item.body}</p>
                  {orderRef && (
                    <span className="oh-notification-order-ref">
                      {t('myOrders.orderRef')}: {orderRef}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
