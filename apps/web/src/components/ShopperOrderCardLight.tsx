import type { ShopperOrderView } from '@popup-cube/shared';
import {
  canConfirmPurchase,
  canFileClaim,
  isCancellableByShopper,
} from '../lib/orders';
import { formatOrderRef } from '../lib/orderRef';
import { orderStatusBadgeStyle } from '../lib/ownerOrderStatusBadge';
import { reviewKey } from '../lib/reviews';
import { t } from '../i18n';

interface ShopperOrderCardLightProps {
  order: ShopperOrderView;
  reviewKeys: Set<string>;
  actionId: string | null;
  claimFormId: string | null;
  claimDraft: Record<string, string>;
  onWriteReview: (order: ShopperOrderView, productId: string, productName: string) => void;
  onConfirmPurchase: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onSubmitClaim: (orderId: string) => void;
  onOpenClaimForm: (orderId: string) => void;
  onClaimDraftChange: (orderId: string, text: string) => void;
}

/** `/app/me` 구매 내역 — 점주 발주·배송 탭과 동일한 카드 위계 (§60, 썸네일은 4-D) */
export function ShopperOrderCardLight({
  order,
  reviewKeys,
  actionId,
  claimFormId,
  claimDraft,
  onWriteReview,
  onConfirmPurchase,
  onCancelOrder,
  onSubmitClaim,
  onOpenClaimForm,
  onClaimDraftChange,
}: ShopperOrderCardLightProps) {
  const reviewEligible = canFileClaim(order.status);
  const showTimeline =
    order.status === 'shipped' ||
    order.status === 'delivery_completed' ||
    order.status === 'purchase_confirmed';

  const hasActions =
    canConfirmPurchase(order.status) ||
    isCancellableByShopper(order.status) ||
    (canFileClaim(order.status) && order.claim_status !== 'open');

  return (
    <article className="oh-card">
      <header className="oh-card-top">
        <div className="oh-card-top-main">
          <div className="oh-card-ref-row">
            {order.store_code && (
              <span className="oh-order-ref">{formatOrderRef(order.store_code, order.order_number)}</span>
            )}
            <span style={orderStatusBadgeStyle(order.status)}>{t(`ownerOrders.status.${order.status}`)}</span>
            {order.status === 'purchase_confirmed' && order.purchase_confirm_auto && (
              <span className="oh-chip-auto">{t('ownerOrders.purchaseConfirmedAutoBadge')}</span>
            )}
          </div>
          <div className="oh-card-meta">
            <span className="oh-store-name">{order.store_name ?? '-'}</span>
            <span className="oh-meta-sep" aria-hidden="true">
              ·
            </span>
            <time className="oh-date-inline">{formatDate(order.created_at)}</time>
          </div>
        </div>
        <div className="oh-amount-block">
          {(order.shipping_fee ?? 0) > 0 && (
            <div className="oh-amount-line">
              <span>{t('myOrders.productSubtotal')}</span>
              <span>{formatPrice(order.subtotal_amount ?? order.total_amount)}</span>
            </div>
          )}
          {(order.shipping_fee ?? 0) > 0 && (
            <div className="oh-amount-line">
              <span>{t('myOrders.shippingFee')}</span>
              <span>{formatPrice(order.shipping_fee ?? 0)}</span>
            </div>
          )}
          <strong className="oh-total">{formatPrice(order.total_amount)}</strong>
        </div>
      </header>

      <section className="oh-items-section" aria-label={t('myOrders.itemsCount', { count: order.items.length })}>
        <div className="oh-section-label">{t('myOrders.itemsCount', { count: order.items.length })}</div>
        <ul className="oh-item-list">
          {order.items.map((item) => {
            const alreadyReviewed = reviewKeys.has(reviewKey(order.id, item.product_id));
            return (
              <li key={item.id} className="oh-item-row">
                <span className="oh-item-name">{item.product_name}</span>
                <span className="oh-item-qty">× {item.quantity}</span>
                {reviewEligible &&
                  (alreadyReviewed ? (
                    <span className="oh-review-done">{t('myOrders.reviewDone')}</span>
                  ) : (
                    <button
                      type="button"
                      className="oh-review-btn"
                      disabled={actionId === order.id}
                      onClick={() => onWriteReview(order, item.product_id, item.product_name)}
                    >
                      {t('myOrders.writeReview')}
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>

        {order.reward_type === 'gacha' && order.gacha_prize_name && (
          <div className="oh-gacha-box">
            <div className="oh-gacha-label">{t('myOrders.gachaOnOrder')}</div>
            <div className="oh-gacha-prize-row">
              {order.gacha_prize_image_url ? (
                <img src={order.gacha_prize_image_url} alt="" className="oh-gacha-thumb" />
              ) : (
                <span className="oh-gacha-emoji" aria-hidden="true">
                  🎁
                </span>
              )}
              <span className="oh-gacha-prize-name">{order.gacha_prize_name}</span>
            </div>
          </div>
        )}
      </section>

      {order.status === 'cancelled' && <p className="oh-cancelled-note">{t('myOrders.cancelledNote')}</p>}

      {showTimeline && (
        <div className="oh-timeline-row">
          {order.shipped_at && (
            <span className="oh-timeline-chip">
              {t('ownerOrders.shippedAt')} {formatDate(order.shipped_at)}
              {order.tracking_number ? ` · ${order.tracking_number}` : ''}
            </span>
          )}
          {order.delivery_completed_at && (
            <span className="oh-timeline-chip oh-timeline-chip--success">
              {t('ownerOrders.deliveryCompletedAt')} {formatDate(order.delivery_completed_at)}
            </span>
          )}
          {order.purchase_confirmed_at && (
            <span className="oh-timeline-chip oh-timeline-chip--success">
              {t('ownerOrders.purchaseConfirmedAt')} {formatDate(order.purchase_confirmed_at)}
            </span>
          )}
        </div>
      )}

      {order.claim_status !== 'none' && (
        <div className="oh-claim-box">
          <div className="oh-claim-label">{t('myOrders.claimMessageLabel')}</div>
          <p className="oh-claim-text">{order.claim_message}</p>
          {order.claim_status === 'open' ? (
            <p className="oh-claim-open-note">{t('myOrders.claimOpenNote')}</p>
          ) : (
            <>
              <div className="oh-claim-label">{t('myOrders.claimReplyLabel')}</div>
              <p className="oh-claim-text">{order.claim_reply}</p>
            </>
          )}
        </div>
      )}

      {hasActions && (
        <footer className="oh-action-bar">
          {canConfirmPurchase(order.status) && (
            <div className="oh-action-group">
              <button
                type="button"
                className="oh-btn-primary"
                disabled={actionId === order.id}
                onClick={() => onConfirmPurchase(order.id)}
              >
                {t('myOrders.confirmPurchase')}
              </button>
              <p className="oh-auto-hint">{t('cart.purchaseConfirmAutoRule')}</p>
            </div>
          )}

          {isCancellableByShopper(order.status) && (
            <button
              type="button"
              className="oh-btn-danger"
              disabled={actionId === order.id}
              onClick={() => onCancelOrder(order.id)}
            >
              {t('myOrders.cancelOrder')}
            </button>
          )}

          {canFileClaim(order.status) && order.claim_status !== 'open' && (
            <>
              {claimFormId === order.id ? (
                <div className="oh-claim-form">
                  <textarea
                    className="oh-claim-textarea"
                    value={claimDraft[order.id] ?? ''}
                    onChange={(e) => onClaimDraftChange(order.id, e.target.value)}
                    placeholder={t('myOrders.claimPlaceholder')}
                  />
                  <button
                    type="button"
                    className="oh-btn-primary"
                    disabled={actionId === order.id}
                    onClick={() => onSubmitClaim(order.id)}
                  >
                    {actionId === order.id ? t('myOrders.claimSubmitting') : t('myOrders.claimSubmit')}
                  </button>
                </div>
              ) : (
                <button type="button" className="oh-btn-secondary" onClick={() => onOpenClaimForm(order.id)}>
                  {order.claim_status === 'resolved' ? t('myOrders.claimAgain') : t('myOrders.claimButton')}
                </button>
              )}
            </>
          )}
        </footer>
      )}
    </article>
  );
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
