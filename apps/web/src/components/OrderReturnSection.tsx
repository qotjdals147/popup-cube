import { useState } from 'react';
import type { OrderReturnStatus } from '@popup-cube/shared';
import { returnReasonLabelKey } from '@popup-cube/shared';
import { formatClaimDateTime } from '../lib/claimFormat';
import { copyTextToClipboard, formatReturnAddressParts } from '../lib/returnAddressText';
import { t } from '../i18n';

export interface OrderReturnSectionProps {
  returnStatus: OrderReturnStatus;
  returnKind: 'return' | 'exchange' | null;
  returnReasonCode: string | null;
  returnReasonDetail: string | null;
  returnRequestedAt: string | null;
  returnResolvedAt: string | null;
  returnOwnerReply: string | null;
  returnAddress?: {
    recipient: string | null;
    phone: string | null;
    postal: string | null;
    line1: string | null;
    line2: string | null;
  };
  variant: 'shopper' | 'owner';
  embedded?: boolean;
}

function ReturnAddressBlock({
  returnAddress,
  variant,
}: {
  returnAddress: NonNullable<OrderReturnSectionProps['returnAddress']>;
  variant: 'shopper' | 'owner';
}) {
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const isShopper = variant === 'shopper';

  async function handleCopy() {
    if (!returnAddress.line1) return;
    const ok = await copyTextToClipboard(formatReturnAddressParts(returnAddress));
    setCopyState(ok ? 'ok' : 'fail');
    if (ok) window.setTimeout(() => setCopyState('idle'), 2000);
  }

  return (
    <div className={isShopper ? 'oh-shipping-block' : undefined} style={isShopper ? { marginTop: 8 } : { marginTop: 8 }}>
      <div className={isShopper ? 'oh-return-address-head' : undefined} style={isShopper ? undefined : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div className={isShopper ? 'oh-section-label' : undefined} style={isShopper ? undefined : { fontWeight: 600, fontSize: 13 }}>
          {t('myOrders.returnAddressLabel')}
        </div>
        {isShopper && (
          <button type="button" className="oh-return-copy-btn" onClick={() => void handleCopy()}>
            {copyState === 'ok'
              ? t('myOrders.returnAddressCopied')
              : copyState === 'fail'
                ? t('myOrders.returnAddressCopyFailed')
                : t('myOrders.returnAddressCopy')}
          </button>
        )}
      </div>
      <p className={isShopper ? 'oh-shipping-name' : undefined}>
        {returnAddress.recipient}
        {returnAddress.phone ? ` · ${returnAddress.phone}` : ''}
      </p>
      <p className={isShopper ? 'oh-shipping-address' : undefined}>
        ({returnAddress.postal}) {returnAddress.line1}
        {returnAddress.line2 ? ` ${returnAddress.line2}` : ''}
      </p>
    </div>
  );
}

/** AD-073 R2 — 반품·교환 신청 상태 블록 */
export function OrderReturnSection({
  returnStatus,
  returnKind,
  returnReasonCode,
  returnReasonDetail,
  returnRequestedAt,
  returnResolvedAt,
  returnOwnerReply,
  returnAddress,
  variant,
  embedded = false,
}: OrderReturnSectionProps) {
  if (returnStatus === 'none') return null;

  const isShopper = variant === 'shopper';

  const content = (
    <>
      <div className={isShopper ? 'oh-claim-label' : undefined}>
        {returnKind === 'exchange' ? t('myOrders.returnKindExchange') : t('myOrders.returnKindReturn')}
        {' · '}
        {t(`myOrders.returnStatus.${returnStatus}`)}
      </div>
      {returnRequestedAt && (
        <div className={isShopper ? 'oh-claim-time' : undefined}>
          <span>{t('myOrders.returnSubmittedAt')}</span>
          <time dateTime={returnRequestedAt}>{formatClaimDateTime(returnRequestedAt)}</time>
        </div>
      )}
      {returnReasonCode && (
        <p className={isShopper ? 'oh-claim-text' : undefined}>
          {t('myOrders.returnReasonLabel')}: {t(returnReasonLabelKey(returnReasonCode))}
          {returnReasonDetail ? ` — ${returnReasonDetail}` : ''}
        </p>
      )}
      {returnStatus === 'requested' && (
        <p className={isShopper ? 'oh-claim-open-note' : undefined}>{t('myOrders.returnOpenNote')}</p>
      )}
      {(returnStatus === 'approved' || returnStatus === 'completed') && returnAddress?.line1 && (
        <ReturnAddressBlock returnAddress={returnAddress} variant={variant} />
      )}
      {(returnStatus === 'rejected' || returnStatus === 'completed') && returnOwnerReply && (
        <>
          <div className={isShopper ? 'oh-claim-label' : undefined} style={isShopper ? undefined : { marginTop: 8 }}>
            {t('myOrders.returnOwnerReplyLabel')}
          </div>
          {returnResolvedAt && (
            <div className={isShopper ? 'oh-claim-time' : undefined}>
              <span>{t('myOrders.returnResolvedAt')}</span>
              <time dateTime={returnResolvedAt}>{formatClaimDateTime(returnResolvedAt)}</time>
            </div>
          )}
          <p className={isShopper ? 'oh-claim-text' : undefined}>{returnOwnerReply}</p>
        </>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className={isShopper ? 'oh-claim-section' : undefined} aria-label={t('myOrders.returnSectionTitle')}>
      {!isShopper && <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('myOrders.returnSectionTitle')}</div>}
      {content}
    </section>
  );
}
