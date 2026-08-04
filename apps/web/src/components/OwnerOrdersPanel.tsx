import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OwnerOrderView } from '@popup-cube/shared';
import {
  acceptOrder,
  isFulfillmentOrderStatus,
  isPendingOrderStatus,
  listStoreOrders,
  rejectOrder,
  shipOrder,
} from '../lib/orders';
import { t } from '../i18n';

export type OwnerOrderQueue = 'pending' | 'fulfillment';

interface OwnerOrdersPanelProps {
  storeId: string;
  onClose?: () => void;
  embedded?: boolean;
  /** 에디터 사이드바에서 탭별로 분리 (AD-052) */
  queue?: OwnerOrderQueue;
  /** AD-055 — Realtime 등 외부 갱신 신호 (증가할 때마다 목록 reload) */
  refreshTick?: number;
}

export function OwnerOrdersPanel({
  storeId,
  onClose,
  embedded = false,
  queue,
  refreshTick = 0,
}: OwnerOrdersPanelProps) {
  const [orders, setOrders] = useState<OwnerOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});
  const [internalQueue, setInternalQueue] = useState<OwnerOrderQueue>('pending');

  const activeQueue = queue ?? internalQueue;

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

  const filtered = useMemo(() => {
    return orders.filter((o) =>
      activeQueue === 'pending' ? isPendingOrderStatus(o.status) : isFulfillmentOrderStatus(o.status)
    );
  }, [orders, activeQueue]);

  async function runAction(orderId: string, fn: () => Promise<void>) {
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

  async function runActionWithConfirm(
    orderId: string,
    confirmMessage: string,
    fn: () => Promise<void>
  ) {
    if (!window.confirm(confirmMessage)) return;
    await runAction(orderId, fn);
  }

  const titleKey =
    activeQueue === 'pending' ? 'ownerOrders.titlePending' : 'ownerOrders.titleFulfillment';

  const panelBody = (
    <>
      {!embedded && (
        <div style={styles.header}>
          <h3 style={styles.title}>{t(titleKey)}</h3>
          {onClose && (
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      )}

      {!queue && (
        <div style={styles.subNav}>
          <button
            type="button"
            style={{ ...styles.subNavBtn, ...(activeQueue === 'pending' ? styles.subNavActive : {}) }}
            onClick={() => setInternalQueue('pending')}
          >
            {t('ownerOrders.tabPending')}
          </button>
          <button
            type="button"
            style={{
              ...styles.subNavBtn,
              ...(activeQueue === 'fulfillment' ? styles.subNavActive : {}),
            }}
            onClick={() => setInternalQueue('fulfillment')}
          >
            {t('ownerOrders.tabFulfillment')}
          </button>
        </div>
      )}

      {loading && <p style={styles.hint}>{t('ownerOrders.loading')}</p>}
      {!loading && error && <p style={styles.error}>{t('ownerOrders.errorLoad')}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p style={styles.hint}>
          {activeQueue === 'pending' ? t('ownerOrders.emptyPending') : t('ownerOrders.emptyFulfillment')}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={styles.list}>
          {filtered.map((order) => (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.buyer}>
                  {t('ownerOrders.buyer')}: {order.buyer_nickname ?? '-'}
                </span>
                <span style={styles.statusBadge}>{t(`ownerOrders.status.${order.status}`)}</span>
              </div>

              {order.auto_accepted && (
                <p style={styles.autoNote}>{t('ownerOrders.autoAcceptedBadge')}</p>
              )}

              <div style={styles.itemsRow}>{t('ownerOrders.itemsCount', { count: order.items.length })}</div>
              {order.items.map((item) => (
                <div key={item.id} style={styles.itemLine}>
                  {item.product_name} × {item.quantity}
                </div>
              ))}

              {order.reward_type === 'gacha' && (
                <div style={styles.gachaBox}>
                  <div style={styles.gachaLabel}>{t('ownerOrders.gachaOnOrder')}</div>
                  {order.gacha_prize_name ? (
                    <div style={styles.gachaPrizeRow}>
                      {order.gacha_prize_image_url ? (
                        <img src={order.gacha_prize_image_url} alt="" style={styles.gachaThumb} />
                      ) : (
                        <span style={styles.gachaEmoji}>🎁</span>
                      )}
                      <span style={styles.gachaPrizeName}>{order.gacha_prize_name}</span>
                    </div>
                  ) : (
                    <div style={styles.shippingText}>{t('ownerOrders.gachaNotLinked')}</div>
                  )}
                </div>
              )}

              <div style={styles.shippingBox}>
                <div style={styles.shippingLabel}>{t('ownerOrders.shippingTo')}</div>
                {order.shipping_recipient_name ? (
                  <div style={styles.shippingText}>
                    {order.shipping_recipient_name} · {order.shipping_phone} <br />({order.shipping_postal_code}){' '}
                    {order.shipping_address_line1} {order.shipping_address_line2 ?? ''}
                  </div>
                ) : (
                  <div style={styles.shippingText}>{t('ownerOrders.noAddress')}</div>
                )}
              </div>

              {activeQueue === 'pending' && isPendingOrderStatus(order.status) && (
                <div style={styles.actions}>
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    disabled={actionId === order.id}
                    onClick={() =>
                      void runActionWithConfirm(order.id, t('ownerOrders.confirmAccept'), () =>
                        acceptOrder(order.id)
                      )
                    }
                  >
                    {t('ownerOrders.accept')}
                  </button>
                  <button
                    type="button"
                    style={styles.dangerBtn}
                    disabled={actionId === order.id}
                    onClick={() =>
                      void runActionWithConfirm(order.id, t('ownerOrders.confirmReject'), () =>
                        rejectOrder(order.id)
                      )
                    }
                  >
                    {t('ownerOrders.reject')}
                  </button>
                </div>
              )}

              {activeQueue === 'fulfillment' && order.status === 'accepted' && (
                <div style={styles.actions}>
                  <input
                    style={styles.trackingInput}
                    value={trackingDraft[order.id] ?? ''}
                    onChange={(e) =>
                      setTrackingDraft((prev) => ({ ...prev, [order.id]: e.target.value }))
                    }
                    placeholder={t('ownerOrders.trackingPlaceholder')}
                  />
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    disabled={actionId === order.id}
                    onClick={() =>
                      void runActionWithConfirm(order.id, t('ownerOrders.confirmShip'), () =>
                        shipOrder(order.id, trackingDraft[order.id] ?? null)
                      )
                    }
                  >
                    {t('ownerOrders.markShipped')}
                  </button>
                  <button
                    type="button"
                    style={styles.dangerBtn}
                    disabled={actionId === order.id}
                    onClick={() =>
                      void runActionWithConfirm(order.id, t('ownerOrders.confirmCancelAccepted'), () =>
                        rejectOrder(order.id)
                      )
                    }
                  >
                    {t('ownerOrders.cancelAcceptedOrder')}
                  </button>
                </div>
              )}

              {order.status === 'shipped' && (
                <div style={styles.shippedNote}>
                  {t('ownerOrders.shippedAt')}{' '}
                  {order.shipped_at ? formatDate(order.shipped_at) : '-'}
                  {order.tracking_number ? ` · ${t('ownerOrders.tracking')}: ${order.tracking_number}` : ''}
                </div>
              )}

              <div style={styles.footerRow}>
                <span style={styles.date}>{formatDate(order.created_at)}</span>
                <strong style={styles.total}>{formatPrice(order.total_amount)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <section style={styles.embeddedPanel}>
        <h2 style={styles.embeddedTitle}>{t(titleKey)}</h2>
        {panelBody}
      </section>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {panelBody}
      </div>
    </div>
  );
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const styles: Record<string, React.CSSProperties> = {
  embeddedPanel: {
    background: '#16213e',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #2c4270',
  },
  embeddedTitle: { margin: '0 0 16px', fontSize: 18, color: '#fff' },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    padding: 16,
  },
  panel: {
    background: '#16213e',
    borderRadius: 14,
    width: '100%',
    maxWidth: 560,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: 20,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 17, margin: 0 },
  closeButton: { background: 'transparent', border: 'none', color: '#a0a0c0', fontSize: 16, cursor: 'pointer' },
  subNav: { display: 'flex', gap: 8, marginBottom: 14 },
  subNavBtn: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#a0a0c0',
    fontSize: 13,
    cursor: 'pointer',
  },
  subNavActive: { background: '#0f3460', color: '#fff', fontWeight: 600 },
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#0f3460', borderRadius: 10, padding: 14, border: '1px solid #2c4270' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  buyer: { color: '#fff', fontSize: 13, fontWeight: 600 },
  statusBadge: {
    fontSize: 11,
    color: '#d8e4ff',
    border: '1px solid #4062a0',
    borderRadius: 999,
    padding: '2px 8px',
    whiteSpace: 'nowrap',
  },
  autoNote: { color: '#c9a962', fontSize: 11, margin: '0 0 8px' },
  itemsRow: { color: '#9db2df', fontSize: 12, marginBottom: 4 },
  itemLine: { color: '#c9d4ee', fontSize: 12, marginBottom: 2 },
  gachaBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    background: '#1a2236',
    border: '1px dashed #c9a96266',
  },
  gachaLabel: { color: '#c9a962', fontSize: 11, fontWeight: 600, marginBottom: 6 },
  gachaPrizeRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gachaThumb: { width: 36, height: 36, borderRadius: 6, objectFit: 'cover' },
  gachaEmoji: { fontSize: 22 },
  gachaPrizeName: { color: '#fff', fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 },
  shippingBox: { marginTop: 8, padding: 8, borderRadius: 8, background: '#0d1730' },
  shippingLabel: { color: '#8ca4d8', fontSize: 11, marginBottom: 3 },
  shippingText: { color: '#c9d4ee', fontSize: 12, lineHeight: 1.5 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  primaryBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#2ecc71',
    color: '#0d1730',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #8b3a3a',
    background: 'transparent',
    color: '#ff9a9a',
    fontSize: 12,
    cursor: 'pointer',
  },
  trackingInput: {
    flex: '1 1 140px',
    minWidth: 120,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#0d1730',
    color: '#fff',
    fontSize: 12,
  },
  shippedNote: { color: '#8ce0b0', fontSize: 12, marginTop: 10 },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px solid #2c4270',
  },
  date: { color: '#8ca4d8', fontSize: 11 },
  total: { color: '#e94560', fontSize: 14 },
};
