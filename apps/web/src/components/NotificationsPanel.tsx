import { useCallback, useEffect, useState } from 'react';
import type { ShopperNotificationView } from '@popup-cube/shared';
import { formatOrderRef } from '../lib/orderRef';
import { formatOrderDateTime } from '../lib/shopperOrderListUtils';
import {
  deleteAllMyNotifications,
  deleteMyNotification,
  deleteReadNotifications,
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

/** AD-076 — 손님 알림 목록 (쿠팡·배민형 · 삭제) */
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
    setActionId('all-read');
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

  async function handleDeleteOne(item: ShopperNotificationView) {
    setActionId(`delete:${item.id}`);
    try {
      await deleteMyNotification(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      bumpRefresh();
    } catch {
      setError(true);
    } finally {
      setActionId(null);
    }
  }

  async function handleDeleteRead() {
    if (!window.confirm(t('notifications.confirmDeleteRead'))) return;
    setActionId('delete-read');
    try {
      await deleteReadNotifications();
      setItems((prev) => prev.filter((row) => !row.read_at));
      bumpRefresh();
    } catch {
      setError(true);
    } finally {
      setActionId(null);
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm(t('notifications.confirmDeleteAll'))) return;
    setActionId('delete-all');
    try {
      await deleteAllMyNotifications();
      setItems([]);
      bumpRefresh();
    } catch {
      setError(true);
    } finally {
      setActionId(null);
    }
  }

  const hasUnread = items.some((item) => !item.read_at);
  const hasRead = items.some((item) => item.read_at);
  const showToolbar = items.length > 0;

  return (
    <div className={useAccountTokens ? 'oh-notifications' : undefined}>
      {useAccountTokens && showToolbar && (
        <div className="oh-notifications-toolbar">
          {hasUnread && (
            <button
              type="button"
              className="oh-notifications-toolbar-btn"
              disabled={actionId === 'all-read'}
              onClick={() => void handleMarkAllRead()}
            >
              {t('notifications.markAllRead')}
            </button>
          )}
          {hasRead && (
            <button
              type="button"
              className="oh-notifications-toolbar-btn"
              disabled={actionId === 'delete-read'}
              onClick={() => void handleDeleteRead()}
            >
              {t('notifications.deleteRead')}
            </button>
          )}
          <button
            type="button"
            className="oh-notifications-toolbar-btn oh-notifications-toolbar-btn--danger"
            disabled={actionId === 'delete-all'}
            onClick={() => void handleDeleteAll()}
          >
            {t('notifications.deleteAll')}
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
            const busy = actionId === item.id || actionId === `delete:${item.id}`;
            return (
              <li key={item.id} className={useAccountTokens ? 'oh-notification-item' : undefined}>
                <div
                  className={`oh-notification-row${unread ? ' oh-notification-row--unread' : ''}`}
                >
                  <button
                    type="button"
                    className="oh-notification-row-main"
                    disabled={busy}
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
                  <button
                    type="button"
                    className="oh-notification-delete"
                    disabled={busy}
                    aria-label={t('notifications.deleteOne')}
                    onClick={() => void handleDeleteOne(item)}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
