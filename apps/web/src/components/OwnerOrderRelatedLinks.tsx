import type { OwnerOrderView } from '@popup-cube/shared';
import { returnReasonLabelKey } from '@popup-cube/shared';
import {
  isFulfillmentOrderStatus,
  isOnHoldOrderStatus,
  isPendingOrderStatus,
} from '../lib/orders';
import { formatOrderRef } from '../lib/orderRef';
import { focusDateRangeForRelatedLink } from '../lib/ownerOrderFocusDates';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

export type OwnerPanelContext =
  | 'pending'
  | 'hold'
  | 'fulfillment'
  | 'returns-requests'
  | 'returns-claims';

export type OwnerNavigateTarget = {
  tab: 'orders' | 'hold' | 'fulfillment' | 'returns';
  returnsSubTab?: 'requests' | 'claims';
  returnsListFilter?: 'active' | 'history';
  orderId?: string;
  orderQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  focusKey?: string;
  openClaimHistory?: boolean;
};

interface OwnerOrderRelatedLinksProps {
  order: OwnerOrderView;
  context: OwnerPanelContext;
  storeOpenDate?: string | null;
  onNavigate: (target: OwnerNavigateTarget) => void;
}

function orderHomeTab(order: OwnerOrderView): OwnerNavigateTarget['tab'] {
  if (isPendingOrderStatus(order.status)) return 'orders';
  if (isOnHoldOrderStatus(order.status)) return 'hold';
  return 'fulfillment';
}

function navigateWithFocusDates(
  order: OwnerOrderView,
  storeOpenDate: string | null | undefined,
  onNavigate: (target: OwnerNavigateTarget) => void,
  target: Pick<OwnerNavigateTarget, 'tab' | 'returnsSubTab' | 'returnsListFilter' | 'openClaimHistory'>,
  kind: 'claim' | 'return' | 'orderHome',
) {
  const { dateFrom, dateTo } = focusDateRangeForRelatedLink(storeOpenDate);
  onNavigate({
    ...target,
    orderId: order.id,
    orderQuery: formatOrderRef(order.store_code, order.order_number),
    dateFrom,
    dateTo,
    focusKey: `${order.id}:${kind}:${Date.now()}`,
  });
}

/** 같은 주문이 여러 탭에 걸쳐 있을 때 — 연결 안내 + 탭 이동 */
export function OwnerOrderRelatedLinks({
  order,
  context,
  storeOpenDate,
  onNavigate,
}: OwnerOrderRelatedLinksProps) {
  const items: Array<{ key: string; label: string; detail?: string; action?: () => void; actionLabel?: string }> =
    [];

  const hasActiveReturn =
    order.return_status === 'requested' || order.return_status === 'approved';
  const hasReturnHistory = order.return_status !== 'none';

  if (hasReturnHistory && context !== 'returns-requests') {
    const kind =
      order.return_kind === 'exchange'
        ? t('myOrders.returnKindExchange')
        : t('myOrders.returnKindReturn');
    const status = t(`myOrders.returnStatus.${order.return_status}`);
    const reason = order.return_reason_code
      ? t(returnReasonLabelKey(order.return_reason_code))
      : null;
    items.push({
      key: 'return',
      label: t('ownerOrders.relatedReturn', { kind, status }),
      detail: reason ?? undefined,
      action: () => {
        const isHistory =
          order.return_status === 'rejected' || order.return_status === 'completed';
        navigateWithFocusDates(
          order,
          storeOpenDate,
          onNavigate,
          {
            tab: 'returns',
            returnsSubTab: 'requests',
            returnsListFilter: isHistory ? 'history' : 'active',
          },
          'return',
        );
      },
      actionLabel: hasActiveReturn ? t('ownerOrders.relatedGoReturns') : t('ownerOrders.relatedViewReturns'),
    });
  }

  const hasOpenClaim = order.claim_status === 'open';
  const hasClaimHistory = hasOpenClaim || order.claim_round_count > 0;

  if (hasClaimHistory && context !== 'returns-claims') {
    items.push({
      key: 'claim',
      label: hasOpenClaim
        ? t('ownerOrders.relatedClaimOpen')
        : t('ownerOrders.relatedClaimResolved', { count: order.claim_round_count }),
      detail: hasOpenClaim && order.claim_message ? order.claim_message : undefined,
      action: () => {
        navigateWithFocusDates(
          order,
          storeOpenDate,
          onNavigate,
          {
            tab: 'returns',
            returnsSubTab: 'claims',
            openClaimHistory: !hasOpenClaim && order.claim_round_count >= 2,
          },
          'claim',
        );
      },
      actionLabel: hasOpenClaim
        ? t('ownerOrders.relatedGoClaims')
        : t('ownerOrders.relatedViewClaims'),
    });
  }

  if (context === 'returns-requests' || context === 'returns-claims') {
    const homeTab = orderHomeTab(order);
    const homeKey =
      homeTab === 'orders'
        ? 'ownerOrders.relatedGoOrders'
        : homeTab === 'hold'
          ? 'ownerOrders.relatedGoHold'
          : 'ownerOrders.relatedGoFulfillment';
    items.push({
      key: 'home',
      label: t('ownerOrders.relatedOrderStatus', {
        status: t(`ownerOrders.status.${order.status}`),
      }),
      action: () => {
        navigateWithFocusDates(order, storeOpenDate, onNavigate, { tab: homeTab }, 'orderHome');
      },
      actionLabel: t(homeKey),
    });
  }

  if (items.length === 0) return null;

  return (
    <div style={styles.box} role="region" aria-label={t('ownerOrders.relatedSectionLabel')}>
      <div style={styles.title}>{t('ownerOrders.relatedSectionLabel')}</div>
      <ul style={styles.list}>
        {items.map((item) => (
          <li key={item.key} style={styles.row}>
            <div style={styles.rowMain}>
              <span style={styles.rowLabel}>{item.label}</span>
              {item.detail && <span style={styles.rowDetail}>{item.detail}</span>}
            </div>
            {item.action && item.actionLabel && (
              <button type="button" style={styles.linkBtn} onClick={item.action}>
                {item.actionLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 8,
    background: '#f0f4ff',
    border: '1px solid #c5d4ff',
  },
  title: {
    fontSize: fs.xs,
    fontWeight: 700,
    color: '#364fc7',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowMain: { flex: '1 1 160px', minWidth: 0 },
  rowLabel: { display: 'block', fontSize: fs.sm, fontWeight: 600, color: oc.text },
  rowDetail: {
    display: 'block',
    marginTop: 2,
    fontSize: fs.xs,
    color: oc.textMuted,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  linkBtn: {
    flexShrink: 0,
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid #748ffc',
    background: '#fff',
    color: '#364fc7',
    fontSize: fs.xs,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: ownerFont,
  },
};
