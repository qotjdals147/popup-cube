import { useEffect, useState, type CSSProperties } from 'react';
import type { OrderClaimStatus } from '@popup-cube/shared';
import { formatClaimDateTime } from '../lib/claimFormat';
import { OrderClaimHistoryModal } from './OrderClaimHistoryModal';
import { t } from '../i18n';

export interface OrderClaimSectionProps {
  orderId: string;
  orderRefLabel?: string;
  claimStatus: OrderClaimStatus;
  claimMessage: string | null;
  claimReply: string | null;
  claimCreatedAt: string | null;
  claimResolvedAt: string | null;
  claimRoundCount: number;
  variant: 'shopper' | 'owner';
  messageLabel: string;
  replyLabel: string;
  openNote?: string;
  autoOpenHistory?: boolean;
  /** 점주 claimBox 안에 삽입 시 true — 바깥 래퍼·제목 생략 */
  embedded?: boolean;
  children?: React.ReactNode;
}

/** AD-077 — 문의 블록 (최근 1세트 + 시각 + 이력 링크) */
export function OrderClaimSection({
  orderId,
  orderRefLabel,
  claimStatus,
  claimMessage,
  claimReply,
  claimCreatedAt,
  claimResolvedAt,
  claimRoundCount,
  variant,
  messageLabel,
  replyLabel,
  openNote,
  autoOpenHistory = false,
  embedded = false,
  children,
}: OrderClaimSectionProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const isShopper = variant === 'shopper';

  useEffect(() => {
    if (autoOpenHistory && claimRoundCount >= 2) {
      setHistoryOpen(true);
    }
  }, [autoOpenHistory, claimRoundCount]);

  if (claimStatus === 'none') return null;

  const showHistoryLink = claimRoundCount >= 2;

  const content = (
    <>
        <div className={isShopper ? 'oh-claim-label' : undefined} style={isShopper ? undefined : labelStyle}>
          {messageLabel}
        </div>
        {claimCreatedAt && (
          <div className={isShopper ? 'oh-claim-time' : undefined} style={isShopper ? undefined : timeStyle}>
            <span>{t('myOrders.claimSubmittedAt')}</span>
            <time dateTime={claimCreatedAt}>{formatClaimDateTime(claimCreatedAt)}</time>
          </div>
        )}
        <p className={isShopper ? 'oh-claim-text' : undefined} style={isShopper ? undefined : textStyle}>
          {claimMessage}
        </p>

        {claimStatus === 'open' ? (
          openNote ? (
            <p className={isShopper ? 'oh-claim-open-note' : undefined} style={isShopper ? undefined : openNoteStyle}>
              {openNote}
            </p>
          ) : null
        ) : (
          <>
            <div className={isShopper ? 'oh-claim-label' : undefined} style={isShopper ? undefined : { ...labelStyle, marginTop: 8 }}>
              {replyLabel}
            </div>
            {claimResolvedAt && (
              <div className={isShopper ? 'oh-claim-time' : undefined} style={isShopper ? undefined : timeStyle}>
                <span>{t('myOrders.claimRepliedAt')}</span>
                <time dateTime={claimResolvedAt}>{formatClaimDateTime(claimResolvedAt)}</time>
              </div>
            )}
            <p className={isShopper ? 'oh-claim-text' : undefined} style={isShopper ? undefined : textStyle}>
              {claimReply}
            </p>
          </>
        )}

        {children}

        {showHistoryLink && (
          <button
            type="button"
            className={isShopper ? 'oh-claim-history-link' : undefined}
            style={isShopper ? undefined : historyLinkStyle}
            onClick={() => setHistoryOpen(true)}
          >
            {t('myOrders.claimHistoryLink', { count: claimRoundCount })}
          </button>
        )}
    </>
  );

  return (
    <>
      {isShopper ? <div className="oh-claim-box">{content}</div> : embedded ? content : <div style={ownerBoxStyle}>{content}</div>}

      {historyOpen && (
        <OrderClaimHistoryModal
          orderId={orderId}
          orderRefLabel={orderRefLabel}
          variant={variant}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </>
  );
}

const ownerBoxStyle: CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 8,
  background: '#f3f0ff',
  border: '1px solid #e5dbff',
};

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 600, color: '#495057' };

const timeStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 11,
  color: '#868e96',
  margin: '2px 0 4px',
};

const textStyle: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' };

const openNoteStyle: CSSProperties = { margin: '8px 0 0', fontSize: 12, color: '#495057' };

const historyLinkStyle: CSSProperties = {
  marginTop: 10,
  padding: 0,
  border: 'none',
  background: 'none',
  color: '#5f3dc4',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
};
