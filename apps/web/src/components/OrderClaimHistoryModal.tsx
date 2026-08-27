import { useEffect, useState, type CSSProperties } from 'react';
import { formatClaimDateTime } from '../lib/claimFormat';
import { listOrderClaimHistory, OrderError, type OrderClaimRound } from '../lib/orders';
import { t } from '../i18n';

interface OrderClaimHistoryModalProps {
  orderId: string;
  orderRefLabel?: string;
  variant: 'shopper' | 'owner';
  onClose: () => void;
}

/** AD-077 — 문의 전체 이력 (타임라인 · 타임스탬프) */
export function OrderClaimHistoryModal({
  orderId,
  orderRefLabel,
  variant,
  onClose,
}: OrderClaimHistoryModalProps) {
  const [rounds, setRounds] = useState<OrderClaimRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void listOrderClaimHistory(orderId)
      .then((rows) => {
        if (!cancelled) setRounds(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(true);
          if (err instanceof OrderError) console.warn(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const isShopper = variant === 'shopper';

  return (
    <div
      className={isShopper ? 'oh-claim-history-overlay' : undefined}
      style={isShopper ? undefined : overlayStyle}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={isShopper ? 'oh-claim-history-modal' : undefined}
        style={isShopper ? undefined : modalStyle}
        role="dialog"
        aria-labelledby="claim-history-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={isShopper ? 'oh-claim-history-head' : undefined} style={isShopper ? undefined : headStyle}>
          <h3 id="claim-history-title" className={isShopper ? 'oh-claim-history-title' : undefined} style={isShopper ? undefined : titleStyle}>
            {t('myOrders.claimHistoryTitle')}
            {orderRefLabel ? ` · ${orderRefLabel}` : ''}
          </h3>
          <button type="button" className={isShopper ? 'oh-claim-history-close' : undefined} style={isShopper ? undefined : closeBtnStyle} onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        {loading && <p className={isShopper ? 'oh-claim-history-hint' : undefined} style={isShopper ? undefined : hintStyle}>{t('myOrders.claimHistoryLoading')}</p>}
        {!loading && error && <p className={isShopper ? 'oh-claim-history-error' : undefined} style={isShopper ? undefined : errorStyle}>{t('myOrders.claimHistoryError')}</p>}

        {!loading && !error && (
          <ol className={isShopper ? 'oh-claim-history-list' : undefined} style={isShopper ? undefined : listStyle}>
            {rounds.map((round) => (
              <li key={round.round_no} className={isShopper ? 'oh-claim-history-round' : undefined} style={isShopper ? undefined : roundStyle}>
                <div className={isShopper ? 'oh-claim-history-round-label' : undefined} style={isShopper ? undefined : roundLabelStyle}>
                  {t('myOrders.claimHistoryRound', { n: round.round_no })}
                </div>
                <div className={isShopper ? 'oh-claim-history-msg' : undefined} style={isShopper ? undefined : msgBlockStyle}>
                  <div className={isShopper ? 'oh-claim-history-msg-head' : undefined} style={isShopper ? undefined : msgHeadStyle}>
                    <span>{t('myOrders.claimSubmittedAt')}</span>
                    <time dateTime={round.shopper_created_at}>{formatClaimDateTime(round.shopper_created_at)}</time>
                  </div>
                  <p className={isShopper ? 'oh-claim-history-text' : undefined} style={isShopper ? undefined : textStyle}>{round.shopper_message}</p>
                </div>
                {round.status === 'resolved' && round.owner_reply ? (
                  <div className={isShopper ? 'oh-claim-history-msg oh-claim-history-msg--reply' : undefined} style={isShopper ? undefined : { ...msgBlockStyle, marginTop: 8 }}>
                    <div className={isShopper ? 'oh-claim-history-msg-head' : undefined} style={isShopper ? undefined : msgHeadStyle}>
                      <span>{t('myOrders.claimRepliedAt')}</span>
                      <time dateTime={round.owner_replied_at ?? ''}>
                        {round.owner_replied_at ? formatClaimDateTime(round.owner_replied_at) : '—'}
                      </time>
                    </div>
                    <p className={isShopper ? 'oh-claim-history-text' : undefined} style={isShopper ? undefined : textStyle}>{round.owner_reply}</p>
                  </div>
                ) : (
                  <p className={isShopper ? 'oh-claim-history-pending' : undefined} style={isShopper ? undefined : pendingStyle}>{t('myOrders.claimHistoryPending')}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: 16,
};

const modalStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  maxWidth: 480,
  width: '100%',
  maxHeight: '80vh',
  overflow: 'auto',
  padding: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
};

const headStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
};

const titleStyle: CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700 };

const closeBtnStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 18,
  cursor: 'pointer',
  lineHeight: 1,
};

const hintStyle: CSSProperties = { color: '#666', fontSize: 13 };

const errorStyle: CSSProperties = { color: '#c92a2a', fontSize: 13 };

const listStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 };

const roundStyle: CSSProperties = {
  border: '1px solid #eee',
  borderRadius: 8,
  padding: 12,
};

const roundLabelStyle: CSSProperties = { fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 };

const msgBlockStyle: CSSProperties = { fontSize: 13 };

const msgHeadStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 11,
  color: '#868e96',
  marginBottom: 4,
};

const textStyle: CSSProperties = { margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' };

const pendingStyle: CSSProperties = { margin: '8px 0 0', fontSize: 12, color: '#868e96' };
