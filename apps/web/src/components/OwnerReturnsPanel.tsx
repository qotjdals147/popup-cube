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
import { formatClaimDateTime } from '../lib/claimFormat';
import { formatOrderRef } from '../lib/orderRef';
import { orderStatusBadgeStyle } from '../lib/ownerOrderStatusBadge';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { OwnerOrderRelatedLinks, type OwnerNavigateTarget } from './OwnerOrderRelatedLinks';
import { t } from '../i18n';

interface OwnerReturnsPanelProps {
  storeId: string;
  refreshTick?: number;
  onNavigateRelated?: (target: OwnerNavigateTarget) => void;
}

export function OwnerReturnsPanel({ storeId, refreshTick = 0, onNavigateRelated }: OwnerReturnsPanelProps) {
  const [orders, setOrders] = useState<OwnerOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [rejectErrorId, setRejectErrorId] = useState<string | null>(null);
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
    <div style={styles.list}>
      {filtered.map((order) => {
        const returnId = order.active_return_id;
        const busy = actionId === order.id;
        const rejectInvalid = rejectErrorId === order.id;
        const kindLabel =
          order.return_kind === 'exchange'
            ? t('myOrders.returnKindExchange')
            : t('myOrders.returnKindReturn');

        return (
          <article key={order.id} style={styles.card}>
            <header style={styles.cardTop}>
              <div style={styles.cardTopMain}>
                <div style={styles.cardRefRow}>
                  <span style={orderStatusBadgeStyle(order.status)}>
                    {t(`ownerOrders.status.${order.status}`)}
                  </span>
                  <span style={styles.orderRef}>
                    {formatOrderRef(order.store_code, order.order_number)}
                  </span>
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.buyerName}>{order.buyer_nickname ?? '-'}</span>
                  {order.return_requested_at && (
                    <>
                      <span style={styles.metaSep}>·</span>
                      <time dateTime={order.return_requested_at} style={styles.dateInline}>
                        {formatClaimDateTime(order.return_requested_at)}
                      </time>
                    </>
                  )}
                </div>
              </div>
              <span style={styles.returnBadge}>{t(`myOrders.returnStatus.${order.return_status}`)}</span>
            </header>

            <div style={styles.cardGrid}>
              <section style={styles.cardSection}>
                <div style={styles.sectionLabel}>{t('ownerOrders.itemsCount', { count: order.items.length })}</div>
                <ul style={styles.itemList}>
                  {order.items.map((item) => (
                    <li key={item.id} style={styles.itemRow}>
                      <span style={styles.itemName}>{item.product_name}</span>
                      <span style={styles.itemQty}>× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section style={styles.cardSection}>
                <div style={styles.sectionLabel}>{kindLabel}</div>
                {order.return_reason_code && (
                  <p style={styles.reasonText}>
                    {t(returnReasonLabelKey(order.return_reason_code))}
                    {order.return_reason_detail ? ` — ${order.return_reason_detail}` : ''}
                  </p>
                )}
                {order.return_status === 'requested' && (
                  <p style={styles.openNote}>{t('myOrders.returnOpenNote')}</p>
                )}
              </section>
            </div>

            {onNavigateRelated && (
              <OwnerOrderRelatedLinks
                order={order}
                context="returns-requests"
                onNavigate={onNavigateRelated}
              />
            )}

            {order.gacha_prize_name && order.return_status === 'approved' && returnId && (
              <fieldset style={styles.gachaFieldset}>
                <legend style={styles.gachaLegend}>
                  {t('ownerReturns.gachaLegend', { name: order.gacha_prize_name })}
                </legend>
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

            <div style={styles.actionBar}>
              {order.return_status === 'requested' && returnId && (
                <>
                  <div style={styles.rejectField}>
                    <label htmlFor={`reject-${order.id}`} style={styles.rejectLabel}>
                      {t('ownerReturns.rejectPlaceholder')}
                    </label>
                    <textarea
                      id={`reject-${order.id}`}
                      style={{
                        ...styles.textarea,
                        ...(rejectInvalid ? styles.textareaError : {}),
                      }}
                      value={rejectDraft[order.id] ?? ''}
                      onChange={(e) => {
                        setRejectDraft((prev) => ({ ...prev, [order.id]: e.target.value }));
                        if (rejectErrorId === order.id && e.target.value.trim()) {
                          setRejectErrorId(null);
                        }
                      }}
                      placeholder={t('ownerReturns.rejectPlaceholder')}
                      aria-invalid={rejectInvalid}
                    />
                    {rejectInvalid && (
                      <p style={styles.rejectHint} role="alert">
                        {t('ownerReturns.rejectRequired')}
                      </p>
                    )}
                  </div>
                  <div style={styles.actionRow}>
                    <button
                      type="button"
                      style={styles.dangerBtn}
                      disabled={busy}
                      onClick={() => {
                        const reply = (rejectDraft[order.id] ?? '').trim();
                        if (!reply) {
                          setRejectErrorId(order.id);
                          return;
                        }
                        if (!window.confirm(t('ownerReturns.confirmReject'))) return;
                        setRejectErrorId(null);
                        void runAction(order.id, returnId, () => rejectReturn(returnId, reply));
                      }}
                    >
                      {t('ownerReturns.reject')}
                    </button>
                    <button
                      type="button"
                      style={styles.primaryBtn}
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(t('ownerReturns.confirmApprove'))) return;
                        void runAction(order.id, returnId, () => approveReturn(returnId));
                      }}
                    >
                      {t('ownerReturns.approve')}
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
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  hint: { color: oc.textMuted, margin: 0, textAlign: 'center', padding: '24px 0' },
  error: { color: oc.danger, margin: 0, textAlign: 'center', padding: '24px 0' },
  card: {
    background: oc.surface,
    borderRadius: 12,
    padding: '16px 18px',
    border: `2px solid ${oc.borderStrong}`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottom: `1px solid ${oc.border}`,
  },
  cardTopMain: { flex: 1, minWidth: 0 },
  cardRefRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 },
  orderRef: { color: oc.orderRef, fontSize: fs.md, fontWeight: 700, fontFamily: ownerFont },
  cardMeta: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, color: oc.textSecondary, fontSize: fs.sm },
  buyerName: { color: oc.text, fontWeight: 600 },
  metaSep: { color: oc.textMuted },
  dateInline: { color: oc.textMuted },
  returnBadge: {
    fontSize: fs.xs,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 999,
    background: oc.navActiveBg,
    color: oc.navActiveText,
    border: `1px solid ${oc.border}`,
    whiteSpace: 'nowrap',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginBottom: 4,
  },
  cardSection: {
    padding: '12px 14px',
    borderRadius: 10,
    background: oc.surfaceMuted,
    border: `1.5px solid ${oc.borderStrong}`,
  },
  sectionLabel: {
    color: oc.textMuted,
    fontSize: fs.xs,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  itemList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  itemRow: { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: fs.sm },
  itemName: { color: oc.text, flex: 1, minWidth: 0 },
  itemQty: { color: oc.textMuted, flexShrink: 0 },
  reasonText: { margin: 0, fontSize: fs.sm, color: oc.textSecondary, lineHeight: 1.5 },
  openNote: { margin: '8px 0 0', fontSize: fs.sm, color: oc.warningText, lineHeight: 1.5 },
  gachaFieldset: {
    marginTop: 12,
    border: `1px solid ${oc.border}`,
    borderRadius: 8,
    padding: '10px 12px',
  },
  gachaLegend: { fontSize: fs.sm, fontWeight: 600, color: oc.text, padding: '0 4px' },
  gachaRadio: { display: 'block', marginBottom: 4, fontSize: fs.sm, fontFamily: ownerFont },
  actionBar: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: `1px solid ${oc.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  rejectField: { display: 'flex', flexDirection: 'column', gap: 6 },
  rejectLabel: { fontSize: fs.xs, fontWeight: 600, color: oc.textMuted },
  textarea: {
    minHeight: 72,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontFamily: ownerFont,
    fontSize: fs.sm,
    resize: 'vertical',
    background: oc.surface,
    color: oc.text,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  textareaError: {
    borderColor: oc.danger,
    boxShadow: `0 0 0 3px ${oc.dangerBg}`,
  },
  rejectHint: { margin: 0, fontSize: fs.xs, color: oc.danger, fontWeight: 600 },
  actionRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
  primaryBtn: {
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: ownerFont,
  },
  dangerBtn: {
    padding: '10px 18px',
    borderRadius: 8,
    border: `1px solid ${oc.dangerBorder}`,
    background: oc.dangerBg,
    color: oc.dangerText,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: ownerFont,
  },
  completeBtn: {
    alignSelf: 'flex-start',
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    background: oc.success,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: ownerFont,
  },
};
