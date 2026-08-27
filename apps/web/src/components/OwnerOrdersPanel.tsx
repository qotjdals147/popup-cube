import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OwnerOrderView } from '@popup-cube/shared';
import {
  acceptOrder,
  completeDelivery,
  holdOrder,
  isFulfillmentOrderStatus,
  isOnHoldOrderStatus,
  isPendingOrderStatus,
  listStoreOrders,
  rejectOrder,
  resolveOrderClaim,
  shipOrder,
} from '../lib/orders';
import { OrderReasonDialog, type OrderReasonDialogResult } from './OrderReasonDialog';
import { formatOrderRef } from '../lib/orderRef';
import {
  DEFAULT_OWNER_ORDER_FILTERS,
  filterAndSortOwnerOrders,
  ownerOrderStatusOptions,
  type OwnerOrderFilters,
  type OwnerOrderQueue,
} from '../lib/ownerOrderFilters';
import { orderStatusBadgeStyle } from '../lib/ownerOrderStatusBadge';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

export type { OwnerOrderQueue } from '../lib/ownerOrderFilters';

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
  const [claimReplyDraft, setClaimReplyDraft] = useState<Record<string, string>>({});
  const [reasonDialog, setReasonDialog] = useState<{
    orderId: string;
    kind: 'hold' | 'reject';
    items: { id: string; product_name: string; quantity: number }[];
  } | null>(null);
  const [internalQueue, setInternalQueue] = useState<OwnerOrderQueue>('pending');
  const [filters, setFilters] = useState<OwnerOrderFilters>(DEFAULT_OWNER_ORDER_FILTERS);

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
    const byQueue = orders.filter((o) => {
      if (activeQueue === 'claims') return o.claim_status === 'open';
      if (activeQueue === 'hold') return isOnHoldOrderStatus(o.status);
      if (activeQueue === 'pending') return isPendingOrderStatus(o.status);
      return isFulfillmentOrderStatus(o.status);
    });
    const list = filterAndSortOwnerOrders(byQueue, filters);
    if (activeQueue === 'claims') {
      return [...list].sort((a, b) => {
        const ta = a.claim_created_at ? new Date(a.claim_created_at).getTime() : 0;
        const tb = b.claim_created_at ? new Date(b.claim_created_at).getTime() : 0;
        return filters.sort === 'oldest' ? ta - tb : tb - ta;
      });
    }
    return list;
  }, [orders, activeQueue, filters]);

  const statusOptions = useMemo(() => ownerOrderStatusOptions(activeQueue), [activeQueue]);

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

  async function handleResolveClaim(orderId: string) {
    const reply = (claimReplyDraft[orderId] ?? '').trim();
    if (!reply) {
      window.alert(t('ownerOrders.claimReplyRequired'));
      return;
    }
    if (!window.confirm(t('ownerOrders.confirmResolveClaim'))) return;
    await runAction(orderId, () => resolveOrderClaim(orderId, reply));
    setClaimReplyDraft((prev) => ({ ...prev, [orderId]: '' }));
  }

  async function handleReasonConfirm(result: OrderReasonDialogResult) {
    if (!reasonDialog) return;
    const { orderId, kind } = reasonDialog;
    setReasonDialog(null);
    await runAction(orderId, async () => {
      if (kind === 'hold') {
        await holdOrder(orderId, result.reasonCode, result.memo, result.affectedItemIds);
      } else {
        await rejectOrder(orderId, result.reasonCode, result.memo);
      }
    });
  }

  const titleKey =
    activeQueue === 'pending'
      ? 'ownerOrders.titlePending'
      : activeQueue === 'hold'
        ? 'ownerOrders.titleHold'
        : activeQueue === 'claims'
          ? 'ownerOrders.titleClaims'
          : 'ownerOrders.titleFulfillment';

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
          <button
            type="button"
            style={{ ...styles.subNavBtn, ...(activeQueue === 'hold' ? styles.subNavActive : {}) }}
            onClick={() => setInternalQueue('hold')}
          >
            {t('ownerOrders.tabHold')}
          </button>
        </div>
      )}

      <div style={styles.filterCard}>
        <div style={styles.filterBar}>
          <input
            style={styles.filterSearch}
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder={t('ownerOrders.filterSearchPlaceholder')}
          />
          <select
            style={styles.filterSelect}
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value as OwnerOrderFilters['status'] }))
            }
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
          <input
            type="date"
            style={styles.filterDate}
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            aria-label={t('ownerOrders.filterDateFrom')}
          />
          <input
            type="date"
            style={styles.filterDate}
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            aria-label={t('ownerOrders.filterDateTo')}
          />
          <select
            style={styles.filterSelect}
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort: e.target.value as OwnerOrderFilters['sort'] }))
            }
          >
            <option value="newest">{t('ownerOrders.sortNewest')}</option>
            <option value="oldest">{t('ownerOrders.sortOldest')}</option>
          </select>
        </div>
      </div>

      <div style={styles.listArea}>
        {loading && <p style={styles.hint}>{t('ownerOrders.loading')}</p>}
        {!loading && error && <p style={styles.error}>{t('ownerOrders.errorLoad')}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p style={styles.hint}>
            {orders.length > 0 && (filters.query || filters.status !== 'all' || filters.dateFrom || filters.dateTo)
              ? t('ownerOrders.emptyFiltered')
              : activeQueue === 'pending'
                ? t('ownerOrders.emptyPending')
                : activeQueue === 'hold'
                  ? t('ownerOrders.emptyHold')
                  : activeQueue === 'claims'
                    ? t('ownerOrders.emptyClaims')
                    : t('ownerOrders.emptyFulfillment')}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={styles.list}>
            {filtered.map((order) => (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.cardTopMain}>
                    <div style={styles.cardRefRow}>
                      <span style={styles.orderRef}>
                        {formatOrderRef(order.store_code, order.order_number)}
                      </span>
                      <span style={orderStatusBadgeStyle(order.status)}>
                        {t(`ownerOrders.status.${order.status}`)}
                      </span>
                      {order.auto_accepted && (
                        <span style={styles.chipAuto}>{t('ownerOrders.autoAcceptedBadge')}</span>
                      )}
                      {order.supplement_submitted_at && isPendingOrderStatus(order.status) && (
                        <span style={styles.chipSupplement}>{t('ownerOrders.supplementBadge')}</span>
                      )}
                      {order.status === 'purchase_confirmed' && order.purchase_confirm_auto && (
                        <span style={styles.chipAuto}>{t('ownerOrders.purchaseConfirmedAutoBadge')}</span>
                      )}
                    </div>
                    <div style={styles.cardMeta}>
                      <span>
                        {t('ownerOrders.buyer')}:{' '}
                        <strong style={styles.buyerName}>{order.buyer_nickname ?? '-'}</strong>
                      </span>
                      <span style={styles.metaSep}>·</span>
                      <span style={styles.dateInline}>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div style={styles.amountBlock}>
                    {(order.shipping_fee ?? 0) > 0 && (
                      <div style={styles.amountLine}>
                        <span>{t('myOrders.productSubtotal')}</span>
                        <span>{formatPrice(order.subtotal_amount ?? order.total_amount)}</span>
                      </div>
                    )}
                    {(order.shipping_fee ?? 0) > 0 && (
                      <div style={styles.amountLine}>
                        <span>{t('myOrders.shippingFee')}</span>
                        <span>{formatPrice(order.shipping_fee ?? 0)}</span>
                      </div>
                    )}
                    <strong style={styles.totalHighlight}>{formatPrice(order.total_amount)}</strong>
                  </div>
                </div>

                <div style={styles.cardGrid}>
                  <div style={styles.cardSection}>
                    <div style={styles.sectionLabel}>
                      {t('ownerOrders.itemsCount', { count: order.items.length })}
                    </div>
                    <ul style={styles.itemList}>
                      {order.items.map((item) => (
                        <li key={item.id} style={styles.itemRow}>
                          <span style={styles.itemName}>{item.product_name}</span>
                          <span style={styles.itemQty}>× {item.quantity}</span>
                        </li>
                      ))}
                    </ul>

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
                  </div>

                  <div style={styles.cardSection}>
                    <div style={styles.sectionLabel}>{t('ownerOrders.shippingTo')}</div>
                    {order.shipping_recipient_name ? (
                      <div style={styles.shippingBlock}>
                        <div style={styles.shippingNameRow}>
                          {order.shipping_recipient_name} · {order.shipping_phone}
                        </div>
                        <div style={styles.shippingAddr}>
                          ({order.shipping_postal_code}) {order.shipping_address_line1}{' '}
                          {order.shipping_address_line2 ?? ''}
                        </div>
                      </div>
                    ) : (
                      <div style={styles.shippingText}>{t('ownerOrders.noAddress')}</div>
                    )}
                  </div>
                </div>

                {order.status === 'cancelled' && order.cancelled_by === 'shopper' && (
                  <p style={styles.cancelledNote}>{t('ownerOrders.cancelledByShopperNote')}</p>
                )}

                {order.claim_status !== 'none' &&
                  (activeQueue === 'claims' || order.claim_status === 'resolved') && (
                  <div style={styles.claimBox}>
                    <div style={styles.claimHeader}>
                      <span style={styles.claimTitle}>{t('ownerOrders.claimTitle')}</span>
                      <span style={order.claim_status === 'open' ? styles.claimBadgeOpen : styles.claimBadgeResolved}>
                        {order.claim_status === 'open'
                          ? t('ownerOrders.claimOpenBadge')
                          : t('ownerOrders.claimResolvedBadge')}
                      </span>
                    </div>
                    <div style={styles.claimLabel}>{t('ownerOrders.claimMessageLabel')}</div>
                    <p style={styles.claimText}>{order.claim_message}</p>

                    {order.claim_status === 'open' ? (
                      <div style={styles.claimReplyRow}>
                        <textarea
                          style={styles.claimTextarea}
                          value={claimReplyDraft[order.id] ?? ''}
                          onChange={(e) =>
                            setClaimReplyDraft((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          placeholder={t('ownerOrders.claimReplyPlaceholder')}
                        />
                        <button
                          type="button"
                          style={styles.primaryBtn}
                          disabled={actionId === order.id}
                          onClick={() => void handleResolveClaim(order.id)}
                        >
                          {actionId === order.id ? t('ownerOrders.claimReplySaving') : t('ownerOrders.claimReplyButton')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={styles.claimLabel}>{t('ownerOrders.claimReplyLabel')}</div>
                        <p style={styles.claimText}>{order.claim_reply}</p>
                      </>
                    )}
                  </div>
                )}

                {(order.status === 'shipped' ||
                  order.status === 'delivery_completed' ||
                  order.status === 'purchase_confirmed') && (
                  <div style={styles.timelineRow}>
                    {order.shipped_at && (
                      <span style={styles.timelineChip}>
                        {t('ownerOrders.shippedAt')} {formatDate(order.shipped_at)}
                      </span>
                    )}
                    {order.tracking_number && (
                      <span style={styles.timelineChip}>
                        {t('ownerOrders.tracking')}: {order.tracking_number}
                      </span>
                    )}
                    {order.delivery_completed_at && (
                      <span style={styles.timelineChip}>
                        {t('ownerOrders.deliveryCompletedAt')} {formatDate(order.delivery_completed_at)}
                      </span>
                    )}
                    {order.purchase_confirmed_at && (
                      <span style={styles.timelineChipSuccess}>
                        {t('ownerOrders.purchaseConfirmedAt')} {formatDate(order.purchase_confirmed_at)}
                      </span>
                    )}
                  </div>
                )}

                {order.status === 'on_hold' && order.hold_reason_code && (
                  <div style={styles.holdBox}>
                    <div style={styles.holdLabel}>{t('ownerOrders.holdReasonLabel')}</div>
                    <p style={styles.holdText}>
                      {t(`orderReasons.hold.${order.hold_reason_code}`)}
                      {order.hold_reason_text ? ` — ${order.hold_reason_text}` : ''}
                    </p>
                  </div>
                )}

                {activeQueue === 'pending' && isPendingOrderStatus(order.status) && (
                  <div style={styles.actionBar}>
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
                      style={styles.warnBtn}
                      disabled={actionId === order.id}
                      onClick={() =>
                        setReasonDialog({
                          orderId: order.id,
                          kind: 'hold',
                          items: order.items.map((i) => ({
                            id: i.id,
                            product_name: i.product_name,
                            quantity: i.quantity,
                          })),
                        })
                      }
                    >
                      {t('ownerOrders.requestHold')}
                    </button>
                    <button
                      type="button"
                      style={styles.dangerBtn}
                      disabled={actionId === order.id}
                      onClick={() =>
                        setReasonDialog({
                          orderId: order.id,
                          kind: 'reject',
                          items: order.items.map((i) => ({
                            id: i.id,
                            product_name: i.product_name,
                            quantity: i.quantity,
                          })),
                        })
                      }
                    >
                      {t('ownerOrders.reject')}
                    </button>
                  </div>
                )}

                {activeQueue === 'hold' && isOnHoldOrderStatus(order.status) && (
                  <div style={styles.actionBar}>
                    <p style={styles.holdWaiting}>{t('ownerOrders.holdWaitingShopper')}</p>
                    <button
                      type="button"
                      style={styles.dangerBtn}
                      disabled={actionId === order.id}
                      onClick={() =>
                        setReasonDialog({
                          orderId: order.id,
                          kind: 'reject',
                          items: order.items.map((i) => ({
                            id: i.id,
                            product_name: i.product_name,
                            quantity: i.quantity,
                          })),
                        })
                      }
                    >
                      {t('ownerOrders.reject')}
                    </button>
                  </div>
                )}

                {activeQueue === 'fulfillment' && order.status === 'accepted' && (
                  <div style={styles.actionBar}>
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
                      style={styles.warnBtn}
                      disabled={actionId === order.id}
                      onClick={() =>
                        setReasonDialog({
                          orderId: order.id,
                          kind: 'hold',
                          items: order.items.map((i) => ({
                            id: i.id,
                            product_name: i.product_name,
                            quantity: i.quantity,
                          })),
                        })
                      }
                    >
                      {t('ownerOrders.requestHold')}
                    </button>
                    <button
                      type="button"
                      style={styles.dangerBtn}
                      disabled={actionId === order.id}
                      onClick={() =>
                        setReasonDialog({
                          orderId: order.id,
                          kind: 'reject',
                          items: order.items.map((i) => ({
                            id: i.id,
                            product_name: i.product_name,
                            quantity: i.quantity,
                          })),
                        })
                      }
                    >
                      {t('ownerOrders.cancelAcceptedOrder')}
                    </button>
                  </div>
                )}

                {activeQueue === 'fulfillment' && order.status === 'shipped' && (
                  <div style={styles.actionBar}>
                    <button
                      type="button"
                      style={styles.primaryBtn}
                      disabled={actionId === order.id}
                      onClick={() =>
                        void runActionWithConfirm(order.id, t('ownerOrders.confirmCompleteDelivery'), () =>
                          completeDelivery(order.id)
                        )
                      }
                    >
                      {t('ownerOrders.completeDelivery')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <section style={styles.embeddedPanel}>
        {panelBody}
        {reasonDialog && (
          <OrderReasonDialog
            kind={reasonDialog.kind}
            storeId={storeId}
            orderItems={reasonDialog.items}
            title={
              reasonDialog.kind === 'hold' ? t('ownerOrders.holdDialogTitle') : t('ownerOrders.rejectDialogTitle')
            }
            confirmLabel={
              reasonDialog.kind === 'hold' ? t('ownerOrders.confirmHold') : t('ownerOrders.confirmReject')
            }
            onConfirm={(r) => void handleReasonConfirm(r)}
            onCancel={() => setReasonDialog(null)}
          />
        )}
      </section>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {panelBody}
      </div>
      {reasonDialog && (
        <OrderReasonDialog
          kind={reasonDialog.kind}
          storeId={storeId}
          orderItems={reasonDialog.items}
          title={
            reasonDialog.kind === 'hold' ? t('ownerOrders.holdDialogTitle') : t('ownerOrders.rejectDialogTitle')
          }
          confirmLabel={
            reasonDialog.kind === 'hold' ? t('ownerOrders.confirmHold') : t('ownerOrders.confirmReject')
          }
          onConfirm={(r) => void handleReasonConfirm(r)}
          onCancel={() => setReasonDialog(null)}
        />
      )}
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
    background: oc.surface,
    borderRadius: 12,
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadow,
    overflow: 'hidden',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: oc.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    padding: 16,
  },
  panel: {
    background: oc.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 560,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: 20,
    boxShadow: oc.shadowMd,
    border: `1px solid ${oc.border}`,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: oc.text, fontSize: fs.lg, margin: 0, fontWeight: 600 },
  closeButton: { background: 'transparent', border: 'none', color: oc.textMuted, fontSize: fs.md, cursor: 'pointer' },
  subNav: { display: 'flex', gap: 8, marginBottom: 14, padding: '0 20px' },
  subNavBtn: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.textMuted,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
  subNavActive: { background: oc.navActiveBg, color: oc.navActiveText, fontWeight: 600, border: `1px solid ${oc.border}` },
  filterCard: {
    padding: '16px 20px',
    background: oc.surfaceMuted,
    borderBottom: `1px solid ${oc.border}`,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterSearch: {
    flex: '1 1 200px',
    minWidth: 160,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.sm,
  },
  filterSelect: {
    flex: '0 1 auto',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.sm,
  },
  filterDate: {
    flex: '0 1 auto',
    padding: '9px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.sm,
  },
  listArea: { padding: '16px 20px 20px', background: oc.pageBg },
  hint: { color: oc.textMuted, fontSize: fs.base, textAlign: 'center', padding: '30px 0' },
  error: { color: oc.danger, fontSize: fs.base, textAlign: 'center', padding: '30px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
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
  orderRef: { color: oc.orderRef, fontSize: fs.md, fontWeight: 700 },
  chipAuto: {
    fontSize: fs.xs,
    color: oc.warningText,
    background: oc.warningBg,
    border: `1px solid ${oc.warningBorder}`,
    borderRadius: 999,
    padding: '2px 8px',
  },
  chipSupplement: {
    fontSize: fs.xs,
    color: '#6741d9',
    background: '#f3f0ff',
    border: '1px solid #d0bfff',
    borderRadius: 999,
    padding: '2px 8px',
  },
  cardMeta: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, color: oc.textSecondary, fontSize: fs.sm },
  buyerName: { color: oc.text, fontWeight: 600 },
  metaSep: { color: oc.textMuted },
  dateInline: { color: oc.textMuted },
  totalHighlight: { color: oc.price, fontSize: fs.xl, fontWeight: 700, whiteSpace: 'nowrap' },
  amountBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  amountLine: { display: 'flex', gap: 10, color: oc.textMuted, fontSize: fs.sm },
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
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
    fontSize: fs.base,
    color: oc.text,
  },
  itemName: { flex: 1, minWidth: 0, lineHeight: 1.4 },
  itemQty: { color: oc.textSecondary, fontWeight: 600, flexShrink: 0 },
  gachaBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    background: oc.warningBg,
    border: `1px dashed ${oc.warningBorder}`,
  },
  gachaLabel: { color: oc.warningText, fontSize: fs.xs, fontWeight: 600, marginBottom: 6 },
  gachaPrizeRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gachaThumb: { width: 40, height: 40, borderRadius: 6, objectFit: 'cover' },
  gachaEmoji: { fontSize: 24 },
  gachaPrizeName: { color: oc.text, fontSize: fs.base, fontWeight: 600, flex: 1, minWidth: 0 },
  shippingBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  shippingNameRow: { color: oc.text, fontSize: fs.base, fontWeight: 600 },
  shippingAddr: { color: oc.textSecondary, fontSize: fs.sm, lineHeight: 1.5 },
  shippingText: { color: oc.textSecondary, fontSize: fs.sm, lineHeight: 1.5 },
  timelineRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  timelineChip: {
    fontSize: fs.xs,
    color: oc.textSecondary,
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    borderRadius: 999,
    padding: '4px 10px',
  },
  timelineChipSuccess: {
    fontSize: fs.xs,
    color: oc.successText,
    background: oc.successBg,
    border: `1px solid ${oc.successBorder}`,
    borderRadius: 999,
    padding: '4px 10px',
  },
  actionBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTop: `1px solid ${oc.border}`,
  },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.dangerBorder}`,
    background: oc.dangerBg,
    color: oc.dangerText,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
  warnBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.warningBorder}`,
    background: oc.warningBg,
    color: oc.warningText,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  holdBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    background: '#fff9db',
    border: `1px solid ${oc.warningBorder}`,
  },
  holdLabel: { color: oc.warningText, fontSize: fs.xs, fontWeight: 700, marginBottom: 4 },
  holdText: { color: oc.textSecondary, fontSize: fs.sm, margin: 0, lineHeight: 1.5 },
  holdWaiting: { flex: '1 1 100%', color: oc.textMuted, fontSize: fs.sm, margin: 0 },
  trackingInput: {
    flex: '1 1 180px',
    minWidth: 140,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.sm,
  },
  cancelledNote: { color: oc.dangerText, fontSize: fs.sm, marginTop: 10 },
  claimBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    background: '#f8f0fc',
    border: `1px solid #e9d5ff`,
  },
  claimHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  claimTitle: { color: '#7c3aed', fontSize: fs.sm, fontWeight: 700 },
  claimBadgeOpen: {
    fontSize: fs.xs,
    color: oc.warningText,
    border: `1px solid ${oc.warningBorder}`,
    background: oc.warningBg,
    borderRadius: 999,
    padding: '2px 8px',
  },
  claimBadgeResolved: {
    fontSize: fs.xs,
    color: oc.successText,
    border: `1px solid ${oc.successBorder}`,
    background: oc.successBg,
    borderRadius: 999,
    padding: '2px 8px',
  },
  claimLabel: { color: '#7c3aed', fontSize: fs.xs, marginBottom: 3 },
  claimText: { color: oc.textSecondary, fontSize: fs.sm, lineHeight: 1.5, margin: '0 0 8px', whiteSpace: 'pre-wrap' },
  claimReplyRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  claimTextarea: {
    minHeight: 64,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.sm,
    resize: 'vertical',
    fontFamily: ownerFont,
  },
};
