import type { ShopperOrderView } from '@popup-cube/shared';
import {
  canConfirmPurchase,
  canFileClaim,
  canShowReviewButton,
  isCancellableByShopper,
  orderDiscountAmount,
  orderHasDeliveryTimeline,
  sumOrderItemsSubtotal,
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

/** `/app/me` 구매 내역 — 배송지·결제 상세·배송 타임라인 (§60 · AD-054) */
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
  const reviewEligible = canShowReviewButton(order.status);
  const showTimeline = orderHasDeliveryTimeline(order);
  const itemsSubtotal = sumOrderItemsSubtotal(order.items);
  const discountAmount = orderDiscountAmount(order);
  const hasShippingAddress = Boolean(order.shipping_recipient_name && order.shipping_address_line1);

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
          <span className="oh-total-label">{t('myOrders.orderTotal')}</span>
          <strong className="oh-total">{formatPrice(order.total_amount)}</strong>
        </div>
      </header>

      {hasShippingAddress && (
        <section className="oh-shipping-section" aria-label={t('myOrders.shippingTo')}>
          <div className="oh-section-label">{t('myOrders.shippingTo')}</div>
          <div className="oh-shipping-block">
            <p className="oh-shipping-name">
              {order.shipping_recipient_name}
              {order.shipping_phone ? ` · ${order.shipping_phone}` : ''}
            </p>
            <p className="oh-shipping-address">
              ({order.shipping_postal_code}) {order.shipping_address_line1}
              {order.shipping_address_line2 ? ` ${order.shipping_address_line2}` : ''}
            </p>
          </div>
        </section>
      )}

      <section className="oh-items-section" aria-label={t('myOrders.itemsCount', { count: order.items.length })}>
        <div className="oh-section-label">{t('myOrders.itemsCount', { count: order.items.length })}</div>
        <ul className="oh-item-list">
          {order.items.map((item) => {
            const alreadyReviewed = reviewKeys.has(reviewKey(order.id, item.product_id));
            const lineTotal = item.unit_price * item.quantity;
            return (
              <li key={item.id} className="oh-item-row">
                <div className="oh-item-main">
                  <span className="oh-item-name">{item.product_name}</span>
                  <span className="oh-item-unit">
                    {t('myOrders.lineItemUnit', {
                      price: item.unit_price.toLocaleString('ko-KR'),
                      qty: item.quantity,
                    })}
                  </span>
                </div>
                <span className="oh-item-line-total">{formatPrice(lineTotal)}</span>
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

      <section className="oh-price-detail" aria-label={t('myOrders.priceDetailTitle')}>
        <div className="oh-section-label">{t('myOrders.priceDetailTitle')}</div>
        <dl className="oh-price-lines">
          <div className="oh-price-row">
            <dt>{t('myOrders.productSubtotal')}</dt>
            <dd>{formatPrice(itemsSubtotal)}</dd>
          </div>
          {discountAmount > 0 && order.discount_percent != null && (
            <div className="oh-price-row oh-price-row--discount">
              <dt>{t('myOrders.discountLine', { percent: order.discount_percent })}</dt>
              <dd>−{formatPrice(discountAmount)}</dd>
            </div>
          )}
          <div className="oh-price-row">
            <dt>{t('myOrders.shippingFee')}</dt>
            <dd>
              {(order.shipping_fee ?? 0) > 0 ? formatPrice(order.shipping_fee ?? 0) : t('myOrders.shippingFree')}
            </dd>
          </div>
          <div className="oh-price-row oh-price-row--total">
            <dt>{t('myOrders.orderTotal')}</dt>
            <dd>{formatPrice(order.total_amount)}</dd>
          </div>
        </dl>
      </section>

      {order.status === 'cancelled' && <p className="oh-cancelled-note">{t('myOrders.cancelledNote')}</p>}

      {showTimeline && (
        <div className="oh-timeline-row" aria-label={t('myOrders.timelineTitle')}>
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
