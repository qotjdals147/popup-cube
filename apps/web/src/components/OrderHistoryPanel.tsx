import { useCallback, useEffect, useState } from 'react';
import type { ShopperOrderView } from '@popup-cube/shared';
import { useAuth } from '../context/AuthContext';
import { useShopperOrderRealtime } from '../hooks/useShopperOrderRealtime';
import {
  canConfirmPurchase,
  canFileClaim,
  isAwaitingPurchaseConfirm,
  cancelOrderByShopper,
  confirmPurchase,
  createOrderClaim,
  isCancellableByShopper,
  listMyOrders,
  OrderError,
} from '../lib/orders';
import { formatOrderRef } from '../lib/orderRef';
import { getMyReviewKeys, reviewKey } from '../lib/reviews';
import { ReviewFormModal } from './ReviewFormModal';
import { ShopperOrderCardLight } from './ShopperOrderCardLight';
import { t } from '../i18n';

interface OrderHistoryPanelProps {
  /** 월드 모달 — 닫기 필수 */
  onClose?: () => void;
  /** 앱 「내 정보」탭 — 전체 페이지에 삽입 */
  embedded?: boolean;
  /** AD-065 — `/app/me` 라이트 */
  appearance?: 'light' | 'dark';
}

/**
 * 손님 「내 주문」 (AD-054) — 로그인한 손님이 여러 매장에서 주문한 내역을 모두 모아 보여줌.
 * 배송 완료 이후 「구매확정」을 직접 누르거나, 누르지 않으면 주문일+7일 후 자동 확정됨.
 */
export function OrderHistoryPanel({ onClose, embedded = false, appearance = 'dark' }: OrderHistoryPanelProps) {
  const { userId } = useAuth();
  const { refreshTick, bumpRefresh } = useShopperOrderRealtime(userId);
  /** 앱 `/app/me` WebView — CSS 변수(`--acct-*`) · 라이트·다크 모두 차콜/화이트 토큰 */
  const useAccountTokens = appearance === 'light' || embedded;
  const [orders, setOrders] = useState<ShopperOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [claimFormId, setClaimFormId] = useState<string | null>(null);
  const [claimDraft, setClaimDraft] = useState<Record<string, string>>({});
  const [reviewKeys, setReviewKeys] = useState<Set<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<{
    orderId: string;
    productId: string;
    productName: string;
  } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [data, keys] = await Promise.all([listMyOrders(), getMyReviewKeys().catch(() => new Set<string>())]);
      setOrders(data);
      setReviewKeys(keys);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshTick]);

  async function handleConfirmPurchase(orderId: string) {
    if (!window.confirm(t('myOrders.confirmPurchaseConfirm'))) return;
    setActionId(orderId);
    setActionError(null);
    try {
      await confirmPurchase(orderId);
      await reload();
    } catch (err) {
      setActionError(err instanceof OrderError ? err.message : t('myOrders.confirmPurchaseError'));
    } finally {
      setActionId(null);
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (!window.confirm(t('myOrders.confirmCancelOrder'))) return;
    setActionId(orderId);
    setActionError(null);
    try {
      await cancelOrderByShopper(orderId);
      await reload();
    } catch (err) {
      setActionError(err instanceof OrderError ? err.message : t('myOrders.cancelOrderError'));
    } finally {
      setActionId(null);
    }
  }

  async function handleSubmitClaim(orderId: string) {
    const message = (claimDraft[orderId] ?? '').trim();
    if (!message) {
      setActionError(t('myOrders.claimEmptyError'));
      return;
    }
    setActionId(orderId);
    setActionError(null);
    try {
      await createOrderClaim(orderId, message);
      setClaimFormId(null);
      setClaimDraft((prev) => ({ ...prev, [orderId]: '' }));
      await reload();
    } catch (err) {
      setActionError(err instanceof OrderError ? err.message : t('myOrders.claimSubmitError'));
    } finally {
      setActionId(null);
    }
  }

  async function handleWriteReviewClick(order: ShopperOrderView, productId: string, productName: string) {
    if (order.status === 'purchase_confirmed' || order.status === 'completed') {
      setReviewTarget({ orderId: order.id, productId, productName });
      return;
    }

    // shipped / delivery_completed — 구매확정 없이는 리뷰를 못 남기니 먼저 물어봄
    if (!window.confirm(t('review.needConfirmBody'))) return;

    setActionId(order.id);
    setActionError(null);
    try {
      await confirmPurchase(order.id);
      await reload();
      setReviewTarget({ orderId: order.id, productId, productName });
    } catch (err) {
      setActionError(err instanceof OrderError ? err.message : t('myOrders.confirmPurchaseError'));
    } finally {
      setActionId(null);
    }
  }

  const listBody = (
    <>
      {!embedded && (
        <div style={styles.header}>
          <h3 style={styles.title}>{t('myOrders.title')}</h3>
          {onClose && (
            <button type="button" style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      )}

      {embedded && (
        <h2 className={useAccountTokens ? 'oh-title' : undefined} style={useAccountTokens ? undefined : styles.embeddedTitle}>
          {t('myOrders.title')}
        </h2>
      )}

      {!loading && (
        <div className={useAccountTokens ? 'oh-history-refresh-row' : undefined} style={useAccountTokens ? undefined : styles.refreshRow}>
          <button
            type="button"
            className={useAccountTokens ? 'oh-history-refresh-btn' : undefined}
            style={useAccountTokens ? undefined : styles.refreshBtn}
            onClick={() => {
              bumpRefresh();
              void reload();
            }}
          >
            {t('myOrders.refreshOrders')}
          </button>
        </div>
      )}

      {loading && (
        <p className={useAccountTokens ? 'oh-hint' : undefined} style={useAccountTokens ? undefined : styles.hint}>
          {t('myOrders.loading')}
        </p>
      )}
      {!loading && error && (
        <p className={useAccountTokens ? 'oh-error' : undefined} style={useAccountTokens ? undefined : styles.error}>
          {t('myOrders.errorLoad')}
        </p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className={useAccountTokens ? 'oh-hint' : undefined} style={useAccountTokens ? undefined : styles.hint}>
          {t('myOrders.empty')}
        </p>
      )}

      {actionError && (
        <p className={useAccountTokens ? 'oh-error' : undefined} style={useAccountTokens ? undefined : styles.error}>
          {actionError}
        </p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className={useAccountTokens ? 'oh-list' : undefined} style={useAccountTokens ? undefined : styles.list}>
          {orders.map((order) =>
            useAccountTokens ? (
              <ShopperOrderCardLight
                key={order.id}
                order={order}
                reviewKeys={reviewKeys}
                actionId={actionId}
                claimFormId={claimFormId}
                claimDraft={claimDraft}
                onWriteReview={(o, pid, pname) => void handleWriteReviewClick(o, pid, pname)}
                onConfirmPurchase={(id) => void handleConfirmPurchase(id)}
                onCancelOrder={(id) => void handleCancelOrder(id)}
                onSubmitClaim={(id) => void handleSubmitClaim(id)}
                onOpenClaimForm={setClaimFormId}
                onClaimDraftChange={(id, text) => setClaimDraft((prev) => ({ ...prev, [id]: text }))}
                onReload={reload}
                onActionStart={setActionId}
                onActionEnd={() => setActionId(null)}
              />
            ) : (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardHeaderLeft}>
                    <span style={styles.storeName}>{order.store_name ?? '-'}</span>
                    {order.store_code && (
                      <span style={styles.orderRef}>
                        {t('myOrders.orderRef')}: {formatOrderRef(order.store_code, order.order_number)}
                      </span>
                    )}
                  </div>
                  <span style={styles.statusBadge}>{t(`ownerOrders.status.${order.status}`)}</span>
                </div>

                {order.status === 'purchase_confirmed' && order.purchase_confirm_auto && (
                  <p style={styles.autoNote}>{t('ownerOrders.purchaseConfirmedAutoBadge')}</p>
                )}

                <div style={styles.itemsRow}>{t('myOrders.itemsCount', { count: order.items.length })}</div>
                {order.items.map((item) => {
                  const reviewEligible = canFileClaim(order.status);
                  const alreadyReviewed = reviewKeys.has(reviewKey(order.id, item.product_id));
                  return (
                    <div key={item.id} style={styles.itemRow}>
                      <span style={styles.itemLine}>
                        {item.product_name} × {item.quantity}
                      </span>
                      {reviewEligible &&
                        (alreadyReviewed ? (
                          <span style={styles.reviewDoneBadge}>{t('myOrders.reviewDone')}</span>
                        ) : (
                          <button
                            type="button"
                            style={styles.reviewButton}
                            disabled={actionId === order.id}
                            onClick={() => void handleWriteReviewClick(order, item.product_id, item.product_name)}
                          >
                            {t('myOrders.writeReview')}
                          </button>
                        ))}
                    </div>
                  );
                })}

                {order.reward_type === 'gacha' && order.gacha_prize_name && (
                  <div style={styles.gachaBox}>
                    <div style={styles.gachaLabel}>{t('myOrders.gachaOnOrder')}</div>
                    <div style={styles.gachaPrizeRow}>
                      {order.gacha_prize_image_url ? (
                        <img src={order.gacha_prize_image_url} alt="" style={styles.gachaThumb} />
                      ) : (
                        <span style={styles.gachaEmoji}>🎁</span>
                      )}
                      <span style={styles.gachaPrizeName}>{order.gacha_prize_name}</span>
                    </div>
                  </div>
                )}

                {order.status === 'cancelled' && <p style={styles.cancelledNote}>{t('myOrders.cancelledNote')}</p>}

                {(order.status === 'shipped' ||
                  order.status === 'delivery_completed' ||
                  order.status === 'purchase_confirmed') && (
                  <div style={styles.shippedNote}>
                    {order.shipped_at && (
                      <>
                        {t('ownerOrders.shippedAt')} {formatDate(order.shipped_at)}
                        {order.tracking_number ? ` · ${t('ownerOrders.tracking')}: ${order.tracking_number}` : ''}
                      </>
                    )}
                    {order.delivery_completed_at && (
                      <>
                        <br />
                        {t('ownerOrders.deliveryCompletedAt')} {formatDate(order.delivery_completed_at)}
                      </>
                    )}
                    {order.purchase_confirmed_at && (
                      <>
                        <br />
                        {t('ownerOrders.purchaseConfirmedAt')} {formatDate(order.purchase_confirmed_at)}
                      </>
                    )}
                  </div>
                )}

                {canConfirmPurchase(order.status) && (
                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.primaryBtn}
                      disabled={actionId === order.id}
                      onClick={() => void handleConfirmPurchase(order.id)}
                    >
                      {t('myOrders.confirmPurchase')}
                    </button>
                    <p style={styles.autoConfirmHint}>{t('cart.purchaseConfirmAutoRule')}</p>
                  </div>
                )}

                {isAwaitingPurchaseConfirm(order.status) && (
                  <p style={styles.awaitConfirmBanner}>{t('myOrders.awaitPurchaseConfirm')}</p>
                )}

                {isCancellableByShopper(order.status) && (
                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.dangerBtn}
                      disabled={actionId === order.id}
                      onClick={() => void handleCancelOrder(order.id)}
                    >
                      {t('myOrders.cancelOrder')}
                    </button>
                  </div>
                )}

                {order.claim_status !== 'none' && (
                  <div style={styles.claimBox}>
                    <div style={styles.claimLabel}>{t('myOrders.claimMessageLabel')}</div>
                    <p style={styles.claimText}>{order.claim_message}</p>
                    {order.claim_status === 'open' ? (
                      <p style={styles.claimOpenNote}>{t('myOrders.claimOpenNote')}</p>
                    ) : (
                      <>
                        <div style={styles.claimLabel}>{t('myOrders.claimReplyLabel')}</div>
                        <p style={styles.claimText}>{order.claim_reply}</p>
                      </>
                    )}
                  </div>
                )}

                {canFileClaim(order.status) && order.claim_status !== 'open' && (
                  <div style={styles.actions}>
                    {claimFormId === order.id ? (
                      <div style={styles.claimFormRow}>
                        <textarea
                          style={styles.claimTextarea}
                          value={claimDraft[order.id] ?? ''}
                          onChange={(e) =>
                            setClaimDraft((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          placeholder={t('myOrders.claimPlaceholder')}
                        />
                        <button
                          type="button"
                          style={styles.primaryBtn}
                          disabled={actionId === order.id}
                          onClick={() => void handleSubmitClaim(order.id)}
                        >
                          {actionId === order.id ? t('myOrders.claimSubmitting') : t('myOrders.claimSubmit')}
                        </button>
                      </div>
                    ) : (
                      <button type="button" style={styles.secondaryBtn} onClick={() => setClaimFormId(order.id)}>
                        {order.claim_status === 'resolved' ? t('myOrders.claimAgain') : t('myOrders.claimButton')}
                      </button>
                    )}
                  </div>
                )}

                <div style={styles.footerRow}>
                  <span style={styles.date}>{formatDate(order.created_at)}</span>
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
                    <strong style={styles.total}>{formatPrice(order.total_amount)}</strong>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </>
  );

  const reviewModal = reviewTarget && (
    <ReviewFormModal
      orderId={reviewTarget.orderId}
      productId={reviewTarget.productId}
      productName={reviewTarget.productName}
      appearance={appearance}
      onClose={() => setReviewTarget(null)}
      onSubmitted={() => {
        setReviewTarget(null);
        void reload();
      }}
    />
  );

  if (embedded) {
    return (
      <div className={useAccountTokens ? 'oh-root' : undefined} style={useAccountTokens ? undefined : styles.embeddedRoot}>
        {listBody}
        {reviewModal}
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {listBody}
      </div>
      {reviewModal}
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
  embeddedRoot: { width: '100%' },
  embeddedTitle: { color: '#fff', fontSize: 16, margin: '0 0 14px', fontWeight: 600 },
  refreshRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: 8 },
  refreshBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #495057',
    background: '#343a40',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  awaitConfirmBanner: {
    margin: '8px 0 0',
    padding: '10px 12px',
    borderRadius: 8,
    background: '#edf2ff',
    border: '1.5px solid #748ffc',
    color: '#364fc7',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.45,
  },
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
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center', padding: '10px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#0f3460', borderRadius: 10, padding: 14, border: '1px solid #2c4270' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  cardHeaderLeft: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  storeName: { color: '#fff', fontSize: 13, fontWeight: 600 },
  orderRef: { color: '#c9a962', fontSize: 12, fontWeight: 700 },
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
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemLine: { color: '#c9d4ee', fontSize: 12 },
  reviewButton: {
    flexShrink: 0,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #c9a962',
    background: 'transparent',
    color: '#e9c46a',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  reviewDoneBadge: {
    flexShrink: 0,
    fontSize: 11,
    color: '#8ce0b0',
    border: '1px solid #2f6b4a',
    borderRadius: 999,
    padding: '3px 9px',
  },
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
  shippedNote: { color: '#8ce0b0', fontSize: 12, marginTop: 10, lineHeight: 1.6 },
  cancelledNote: { color: '#ff9a9a', fontSize: 12, margin: '0 0 8px' },
  actions: { marginTop: 10 },
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
  secondaryBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #4062a0',
    background: 'transparent',
    color: '#d8e4ff',
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
  claimBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    background: '#241a2e',
    border: '1px solid #6b3f6b',
  },
  claimLabel: { color: '#c9a6d8', fontSize: 11, marginBottom: 3 },
  claimText: { color: '#e8d8ee', fontSize: 12, lineHeight: 1.5, margin: '0 0 8px', whiteSpace: 'pre-wrap' },
  claimOpenNote: { color: '#ffd8a8', fontSize: 12, margin: 0 },
  claimFormRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  claimTextarea: {
    minHeight: 60,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #6b3f6b',
    background: '#0d1730',
    color: '#fff',
    fontSize: 12,
    resize: 'vertical',
  },
  autoConfirmHint: { color: '#7c8db5', fontSize: 11, lineHeight: 1.5, margin: '6px 0 0' },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px solid #2c4270',
    gap: 12,
  },
  amountBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  amountLine: { display: 'flex', gap: 10, color: '#a0a0c0', fontSize: 12 },
  date: { color: '#8ca4d8', fontSize: 11 },
  total: { color: '#e94560', fontSize: 14 },
};
