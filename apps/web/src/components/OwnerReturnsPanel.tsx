import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GachaReturnStatus, OwnerOrderView } from '@popup-cube/shared';
import { returnReasonLabelKey } from '@popup-cube/shared';
import {
  approveReturn,
  completeReturn,
  getOrderReturn,
  rejectReturn,
  setGachaReturnStatus,
} from '../lib/orderReturns';
import { listStoreOrders } from '../lib/orders';
import { formatOrderRef } from '../lib/orderRef';
import { orderStatusBadgeStyle } from '../lib/ownerOrderStatusBadge';
import { OrderReturnSection } from './OrderReturnSection';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

interface OwnerReturnsPanelProps {
  storeId: string;
  refreshTick?: number;
}

export function OwnerReturnsPanel({ storeId, refreshTick = 0 }: OwnerReturnsPanelProps) {
  const [orders, setOrders] = useState<OwnerOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [gachaStatus, setGachaStatus] = useState<Record<string, GachaReturnStatus>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await listStoreOrders(storeId);
      setOrders(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void reload();
  }, [reload, refreshTick]);

  const filtered = useMemo(
    () =>
      orders
        .filter((o) => o.return_status === 'requested' || o.return_status === 'approved')
        .sort((a, b) => {
          const ta = a.return_requested_at ? new Date(a.return_requested_at).getTime() : 0;
          const tb = b.return_requested_at ? new Date(b.return_requested_at).getTime() : 0;
          return tb - ta;
        }),
    [orders],
  );

  useEffect(() => {
    for (const order of filtered) {
      if (!order.active_return_id || gachaStatus[order.id]) continue;
      void getOrderReturn(order.id).then((detail) => {
        if (detail?.gacha_return_status) {
          setGachaStatus((prev) => ({ ...prev, [order.id]: detail.gacha_return_status! }));
        }
      });
    }
  }, [filtered, gachaStatus]);

  async function runAction(orderId: string, returnId: string | null, fn: () => Promise<void>) {
    if (!returnId) return;
    setActionId(orderId);
    try {
      await fn();
      await reload();
    } catch {
      setError(true);
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return <p style={styles.hint}>{t('ownerReturns.loading')}</p>;
  }
  if (error) {
    return <p style={styles.error}>{t('ownerReturns.errorLoad')}</p>;
  }
  if (filtered.length === 0) {
    return <p style={styles.hint}>{t('ownerReturns.empty')}</p>;
  }

  return (
    <div style={styles.wrap}>
      {filtered.map((order) => {
        const returnId = order.active_return_id;
        const busy = actionId === order.id;
        return (
          <article key={order.id} style={styles.card}>
            <header style={styles.cardHeader}>
              <div>
                <span style={orderStatusBadgeStyle(order.status)}>
                  {t(`ownerOrders.status.${order.status}`)}
                </span>
                <span style={styles.ref}>
                  {formatOrderRef(order.store_code, order.order_number)}
                </span>
              </div>
              <span style={styles.badge}>{t(`myOrders.returnStatus.${order.return_status}`)}</span>
            </header>
            <p style={styles.buyer}>
              {t('ownerOrders.buyer')}: {order.buyer_nickname ?? '-'}
            </p>
            <ul style={styles.itemList}>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.product_name} × {item.quantity}
                </li>
              ))}
            </ul>
            {order.return_reason_code && (
              <p style={styles.reason}>
                {t('myOrders.returnReasonLabel')}: {t(returnReasonLabelKey(order.return_reason_code))}
                {order.return_reason_detail ? ` — ${order.return_reason_detail}` : ''}
              </p>
            )}
            <OrderReturnSection
              returnStatus={order.return_status}
              returnKind={order.return_kind}
              returnReasonCode={order.return_reason_code}
              returnReasonDetail={order.return_reason_detail}
              returnRequestedAt={order.return_requested_at}
              returnResolvedAt={order.return_resolved_at}
              returnOwnerReply={order.return_owner_reply}
              variant="owner"
              embedded
            />
            {order.gacha_prize_name && order.return_status === 'approved' && returnId && (
              <fieldset style={styles.gachaFieldset}>
                <legend>{t('ownerReturns.gachaLegend', { name: order.gacha_prize_name })}</legend>
                {(['pending', 'returned', 'not_returnable'] as GachaReturnStatus[]).map((status) => (
                  <label key={status} style={styles.gachaRadio}>
                    <input
                      type="radio"
                      name={`gacha-${order.id}`}
                      checked={(gachaStatus[order.id] ?? 'pending') === status}
                      onChange={() => {
                        setGachaStatus((prev) => ({ ...prev, [order.id]: status }));
                        void runAction(order.id, returnId, () => setGachaReturnStatus(returnId, status));
                      }}
                      disabled={busy}
                    />
                    {t(`ownerReturns.gachaStatus.${status}`)}
                  </label>
                ))}
              </fieldset>
            )}
            <div style={styles.actions}>
              {order.return_status === 'requested' && returnId && (
                <>
                  <button
                    type="button"
                    style={styles.approveBtn}
                    disabled={busy}
                    onClick={() =>
                      void runAction(order.id, returnId, () => approveReturn(returnId))
                    }
                  >
                    {t('ownerReturns.approve')}
                  </button>
                  <div style={styles.rejectBlock}>
                    <textarea
                      style={styles.textarea}
                      value={rejectDraft[order.id] ?? ''}
                      onChange={(e) =>
                        setRejectDraft((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                      placeholder={t('ownerReturns.rejectPlaceholder')}
                    />
                    <button
                      type="button"
                      style={styles.rejectBtn}
                      disabled={busy}
                      onClick={() => {
                        const reply = (rejectDraft[order.id] ?? '').trim();
                        if (!reply) {
                          window.alert(t('ownerReturns.rejectRequired'));
                          return;
                        }
                        if (!window.confirm(t('ownerReturns.confirmReject'))) return;
                        void runAction(order.id, returnId, () => rejectReturn(returnId, reply));
                      }}
                    >
                      {t('ownerReturns.reject')}
                    </button>
                  </div>
                </>
              )}
              {order.return_status === 'approved' && returnId && (
                <button
                  type="button"
                  style={styles.completeBtn}
                  disabled={busy || (order.gacha_prize_name && (gachaStatus[order.id] ?? 'pending') === 'pending')}
                  onClick={() => {
                    if (!window.confirm(t('ownerReturns.confirmComplete'))) return;
                    void runAction(order.id, returnId, () => completeReturn(returnId));
                  }}
                >
                  {t('ownerReturns.complete')}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  hint: { color: oc.textMuted, margin: 0 },
  error: { color: oc.danger, margin: 0 },
  card: {
    border: `1px solid ${oc.border}`,
    borderRadius: 10,
    padding: 16,
    background: oc.surface,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  ref: { marginLeft: 8, fontWeight: 600, fontFamily: ownerFont },
  badge: {
    fontSize: fs.xs,
    padding: '2px 8px',
    borderRadius: 999,
    background: oc.navActiveBg,
    color: oc.navActiveText,
  },
  buyer: { margin: '8px 0 4px', fontSize: fs.sm, color: oc.textMuted },
  itemList: { margin: '0 0 8px', paddingLeft: 18, fontSize: fs.sm },
  reason: { margin: '0 0 8px', fontSize: fs.sm },
  gachaFieldset: { marginTop: 12, border: `1px solid ${oc.border}`, borderRadius: 8, padding: 10 },
  gachaRadio: { display: 'block', marginBottom: 4, fontSize: fs.sm },
  actions: { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  approveBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: ownerFont,
  },
  rejectBlock: { display: 'flex', flexDirection: 'column', gap: 6 },
  textarea: {
    minHeight: 72,
    padding: 8,
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontFamily: ownerFont,
    fontSize: fs.sm,
  },
  rejectBtn: {
    alignSelf: 'flex-start',
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.danger}`,
    background: 'transparent',
    color: oc.danger,
    cursor: 'pointer',
    fontFamily: ownerFont,
  },
  completeBtn: {
    alignSelf: 'flex-start',
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: oc.success,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: ownerFont,
  },
};
