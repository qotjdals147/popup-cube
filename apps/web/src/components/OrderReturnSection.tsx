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
  evidenceUrls?: string[];
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

function statusTone(status: OrderReturnStatus): 'pending' | 'approved' | 'rejected' | 'done' | 'neutral' {
  if (status === 'requested') return 'pending';
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'completed') return 'done';
  return 'neutral';
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
    <div className={isShopper ? 'oh-return-address-inner' : undefined} style={isShopper ? undefined : ownerAddressStyle}>
      <div className={isShopper ? 'oh-return-address-head' : undefined} style={isShopper ? undefined : ownerAddressHeadStyle}>
        <div className={isShopper ? 'oh-section-label' : undefined} style={isShopper ? undefined : ownerSubLabelStyle}>
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
      <p className={isShopper ? 'oh-shipping-name' : undefined} style={isShopper ? undefined : ownerTextStyle}>
        {returnAddress.recipient}
        {returnAddress.phone ? ` · ${returnAddress.phone}` : ''}
      </p>
      <p className={isShopper ? 'oh-shipping-address' : undefined} style={isShopper ? undefined : ownerTextStyle}>
        ({returnAddress.postal}) {returnAddress.line1}
        {returnAddress.line2 ? ` ${returnAddress.line2}` : ''}
      </p>
    </div>
  );
}

function EvidenceGallery({ urls, variant }: { urls: string[]; variant: 'shopper' | 'owner' }) {
  if (urls.length === 0) return null;
  const isShopper = variant === 'shopper';
  return (
    <div className={isShopper ? 'oh-return-evidence' : undefined} style={isShopper ? undefined : ownerEvidenceStyle}>
      <div className={isShopper ? 'oh-return-evidence-label' : undefined} style={isShopper ? undefined : ownerSubLabelStyle}>
        {t('myOrders.returnEvidenceLabel')}
      </div>
      <div className={isShopper ? 'oh-return-evidence-grid' : undefined} style={isShopper ? undefined : ownerEvidenceGridStyle}>
        {urls.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={isShopper ? 'oh-return-evidence-thumb' : undefined}
            style={isShopper ? undefined : ownerEvidenceThumbStyle}
          >
            <img src={url} alt="" />
          </a>
        ))}
      </div>
    </div>
  );
}

/** AD-073 R2 — 반품·교환 신청 상태 블록 (카드형 · 가시성 우선) */
export function OrderReturnSection({
  returnStatus,
  returnKind,
  returnReasonCode,
  returnReasonDetail,
  returnRequestedAt,
  returnResolvedAt,
  returnOwnerReply,
  evidenceUrls = [],
  returnAddress,
  variant,
  embedded = false,
}: OrderReturnSectionProps) {
  if (returnStatus === 'none') return null;

  const isShopper = variant === 'shopper';
  const tone = statusTone(returnStatus);
  const kindLabel =
    returnKind === 'exchange' ? t('myOrders.returnKindExchange') : t('myOrders.returnKindReturn');
  const statusLabel = t(`myOrders.returnStatus.${returnStatus}`);

  const content = (
    <>
      <div className={isShopper ? 'oh-return-card-head' : undefined} style={isShopper ? undefined : ownerHeadStyle}>
        <span className={isShopper ? `oh-return-kind-badge oh-return-kind-badge--${tone}` : undefined} style={isShopper ? undefined : ownerKindBadgeStyle(tone)}>
          {kindLabel}
        </span>
        <span className={isShopper ? `oh-return-status-badge oh-return-status-badge--${tone}` : undefined} style={isShopper ? undefined : ownerStatusBadgeStyle(tone)}>
          {statusLabel}
        </span>
      </div>

      {returnRequestedAt && (
        <div className={isShopper ? 'oh-return-time-row' : undefined} style={isShopper ? undefined : ownerTimeStyle}>
          <span>{t('myOrders.returnSubmittedAt')}</span>
          <time dateTime={returnRequestedAt}>{formatClaimDateTime(returnRequestedAt)}</time>
        </div>
      )}

      {returnReasonCode && (
        <div className={isShopper ? 'oh-return-reason-box' : undefined} style={isShopper ? undefined : ownerReasonBoxStyle(tone)}>
          <div className={isShopper ? 'oh-return-reason-label' : undefined} style={isShopper ? undefined : ownerSubLabelStyle}>
            {t('myOrders.returnReasonLabel')}
          </div>
          <div className={isShopper ? 'oh-return-reason-value' : undefined} style={isShopper ? undefined : ownerReasonValueStyle}>
            {t(returnReasonLabelKey(returnReasonCode))}
          </div>
          {returnReasonDetail && (
            <p className={isShopper ? 'oh-return-reason-detail' : undefined} style={isShopper ? undefined : ownerDetailStyle}>
              {returnReasonDetail}
            </p>
          )}
        </div>
      )}

      <EvidenceGallery urls={evidenceUrls} variant={variant} />

      {returnStatus === 'requested' && (
        <p className={isShopper ? 'oh-return-open-banner' : undefined} style={isShopper ? undefined : ownerOpenBannerStyle}>
          {t('myOrders.returnOpenNote')}
        </p>
      )}

      {(returnStatus === 'approved' || returnStatus === 'completed') && returnAddress?.line1 && (
        <ReturnAddressBlock returnAddress={returnAddress} variant={variant} />
      )}

      {(returnStatus === 'rejected' || returnStatus === 'completed') && returnOwnerReply && (
        <div className={isShopper ? 'oh-return-reply-box' : undefined} style={isShopper ? undefined : ownerReplyBoxStyle}>
          <div className={isShopper ? 'oh-return-reply-label' : undefined} style={isShopper ? undefined : ownerSubLabelStyle}>
            {t('myOrders.returnOwnerReplyLabel')}
          </div>
          {returnResolvedAt && (
            <div className={isShopper ? 'oh-return-time-row' : undefined} style={isShopper ? undefined : ownerTimeStyle}>
              <span>{t('myOrders.returnResolvedAt')}</span>
              <time dateTime={returnResolvedAt}>{formatClaimDateTime(returnResolvedAt)}</time>
            </div>
          )}
          <p className={isShopper ? 'oh-return-reply-text' : undefined} style={isShopper ? undefined : ownerReplyTextStyle}>
            {returnOwnerReply}
          </p>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  if (isShopper) {
    return (
      <section
        className={`oh-return-card oh-return-card--${tone}`}
        aria-label={t('myOrders.returnSectionTitle')}
      >
        {content}
      </section>
    );
  }

  return (
    <section style={ownerCardStyle(tone)} aria-label={t('myOrders.returnSectionTitle')}>
      <div style={ownerSectionTitleStyle}>{t('myOrders.returnSectionTitle')}</div>
      {content}
    </section>
  );
}

const toneColors = {
  pending: { bg: '#fff8eb', border: '#f59f00', badge: '#e67700' },
  approved: { bg: '#edf2ff', border: '#4263eb', badge: '#364fc7' },
  rejected: { bg: '#fff5f5', border: '#fa5252', badge: '#c92a2a' },
  done: { bg: '#ebfbee', border: '#40c057', badge: '#2b8a3e' },
  neutral: { bg: '#f8f9fa', border: '#adb5bd', badge: '#495057' },
};

function ownerCardStyle(tone: keyof typeof toneColors): React.CSSProperties {
  const c = toneColors[tone];
  return {
    marginTop: 12,
    padding: '14px 16px',
    borderRadius: 10,
    background: c.bg,
    border: `2px solid ${c.border}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };
}

function ownerKindBadgeStyle(tone: keyof typeof toneColors): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    background: '#fff',
    border: `1.5px solid ${toneColors[tone].border}`,
    color: toneColors[tone].badge,
    fontSize: 12,
    fontWeight: 700,
  };
}

function ownerStatusBadgeStyle(tone: keyof typeof toneColors): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    background: toneColors[tone].badge,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
  };
}

function ownerReasonBoxStyle(tone: keyof typeof toneColors): React.CSSProperties {
  return {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 8,
    background: '#fff',
    border: `1px solid ${toneColors[tone].border}`,
  };
}

const ownerHeadStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 };
const ownerSectionTitleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#212529' };
const ownerSubLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#868e96', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 };
const ownerReasonValueStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#212529' };
const ownerDetailStyle: React.CSSProperties = { margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: '#495057', whiteSpace: 'pre-wrap' };
const ownerTimeStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: '#868e96', marginBottom: 6 };
const ownerOpenBannerStyle: React.CSSProperties = { margin: '10px 0 0', padding: '8px 10px', borderRadius: 8, background: '#fff3bf', color: '#e67700', fontSize: 13, fontWeight: 600 };
const ownerReplyBoxStyle: React.CSSProperties = { marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#fff', border: '1px solid #dee2e6' };
const ownerReplyTextStyle: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#212529' };
const ownerTextStyle: React.CSSProperties = { margin: '2px 0', fontSize: 13, color: '#495057' };
const ownerAddressStyle: React.CSSProperties = { marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#fff', border: '1px solid #dee2e6' };
const ownerAddressHeadStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 };
const ownerEvidenceStyle: React.CSSProperties = { marginTop: 10 };
const ownerEvidenceGridStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const ownerEvidenceThumbStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid #dee2e6',
  display: 'block',
};
