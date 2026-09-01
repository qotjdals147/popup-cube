import type { ShopperOrderView } from '@popup-cube/shared';
import { canConfirmPurchase } from '../lib/orders';
import { formatOrderRef } from '../lib/orderRef';
import { formatOrderPrice } from '../lib/shopperOrderListUtils';
import { orderStatusBadgeStyle } from '../lib/ownerOrderStatusBadge';
import { t } from '../i18n';

interface ShopperOrderRowCompactProps {
  order: ShopperOrderView;
  actionId: string | null;
  onOpenDetail: (orderId: string) => void;
  onConfirmPurchase: (orderId: string) => void;
}

export function ShopperOrderRowCompact({
  order,
  actionId,
  onOpenDetail,
  onConfirmPurchase,
}: ShopperOrderRowCompactProps) {
  const firstItem = order.items[0];
  const extraCount = Math.max(0, order.items.length - 1);
  const showConfirm = canConfirmPurchase(order.status);
  const attentionBadges = getAttentionBadges(order);

  const productLabel =
    firstItem != null
      ? extraCount > 0
        ? `${firstItem.product_name} ${t('myOrders.itemsExtra', { count: extraCount })}`
        : firstItem.product_name
      : t('myOrders.itemsCount', { count: order.items.length });

  const priceQty =
    firstItem != null
      ? t('myOrders.lineItemUnit', {
          price: firstItem.unit_price.toLocaleString('ko-KR'),
          qty: firstItem.quantity,
        })
      : formatOrderPrice(order.total_amount);

  return (
    <article className="oh-row">
      <div className="oh-row-status-line">
        <span style={orderStatusBadgeStyle(order.status)}>{t(`ownerOrders.status.${order.status}`)}</span>
        {order.status === 'purchase_confirmed' && order.purchase_confirm_auto && (
          <span className="oh-chip-auto">{t('ownerOrders.purchaseConfirmedAutoBadge')}</span>
        )}
        {attentionBadges.map((badge) => (
          <span key={badge.key} className={`oh-row-badge ${badge.className}`}>
            {badge.label}
          </span>
        ))}
      </div>

      <div className="oh-row-main">
        <div className="oh-row-thumb" aria-hidden="true">
          {firstItem?.product_image_url ? (
            <img src={firstItem.product_image_url} alt="" className="oh-row-thumb-img" />
          ) : (
            <span className="oh-row-thumb-placeholder">🛍️</span>
          )}
          {extraCount > 0 && <span className="oh-row-thumb-more">+{extraCount}</span>}
        </div>

        <div className="oh-row-info">
          <p className="oh-row-name">{productLabel}</p>
          <p className="oh-row-price-qty">{priceQty}</p>
          <p className="oh-row-meta">
            <span className="oh-row-store">{order.store_name ?? '-'}</span>
            {order.store_code && (
              <>
                <span className="oh-meta-sep" aria-hidden="true">
                  ·
                </span>
                <span className="oh-row-ref">{formatOrderRef(order.store_code, order.order_number)}</span>
              </>
            )}
          </p>
        </div>

        <div className="oh-row-amount">
          <span className="oh-row-amount-label">{t('myOrders.orderTotal')}</span>
          <strong className="oh-row-amount-value">{formatOrderPrice(order.total_amount)}</strong>
        </div>
      </div>

      <div className="oh-row-actions">
        {showConfirm && (
          <button
            type="button"
            className="oh-btn-primary oh-row-confirm-btn"
            disabled={actionId === order.id}
            onClick={() => onConfirmPurchase(order.id)}
          >
            {t('myOrders.confirmPurchase')}
          </button>
        )}
        <button type="button" className="oh-row-detail-btn" onClick={() => onOpenDetail(order.id)}>
          {t('myOrders.orderDetail')}
        </button>
      </div>
    </article>
  );
}

function getAttentionBadges(order: ShopperOrderView): Array<{ key: string; label: string; className: string }> {
  const badges: Array<{ key: string; label: string; className: string }> = [];
  if (order.status === 'on_hold') {
    badges.push({ key: 'hold', label: t('myOrders.badgeHold'), className: 'oh-row-badge--hold' });
  }
  if (order.claim_status === 'open') {
    badges.push({ key: 'claim', label: t('myOrders.badgeClaimOpen'), className: 'oh-row-badge--claim' });
  }
  if (order.return_status === 'requested') {
    badges.push({ key: 'return', label: t('myOrders.badgeReturnRequested'), className: 'oh-row-badge--return' });
  } else if (order.return_status === 'approved') {
    badges.push({ key: 'return', label: t('myOrders.badgeReturnApproved'), className: 'oh-row-badge--return' });
  }
  return badges;
}
