import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { OwnerStoreReview } from '@popup-cube/shared';
import { getStoreReviews, ReviewError, setOwnerReviewReply } from '../lib/reviews';
import { formatOrderRef } from '../lib/orderRef';
import { formatClaimDateTime } from '../lib/claimFormat';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

type ReviewFilter = 'all' | 'pending' | 'replied';

interface OwnerReviewsPanelProps {
  storeId: string;
  onPendingCountChange?: (count: number) => void;
}

function starsLabel(rating: number): string {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export function OwnerReviewsPanel({ storeId, onPendingCountChange }: OwnerReviewsPanelProps) {
  const [reviews, setReviews] = useState<OwnerStoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveErrorId, setSaveErrorId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getStoreReviews(storeId);
      setReviews(data);
      const pending = data.filter((r) => !r.owner_reply_body?.trim()).length;
      onPendingCountChange?.(pending);
    } catch (err) {
      console.error('[owner-reviews] load failed:', err);
      setError(true);
      onPendingCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [storeId, onPendingCountChange]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    if (filter === 'pending') {
      return reviews.filter((r) => !r.owner_reply_body?.trim());
    }
    if (filter === 'replied') {
      return reviews.filter((r) => Boolean(r.owner_reply_body?.trim()));
    }
    return reviews;
  }, [reviews, filter]);

  async function handleSave(review: OwnerStoreReview) {
    const text = (draft[review.review_id] ?? review.owner_reply_body ?? '').trim();
    if (!text) {
      setSaveErrorId(review.review_id);
      return;
    }
    setSavingId(review.review_id);
    setSaveErrorId(null);
    try {
      await setOwnerReviewReply(review.review_id, text);
      setDraft((prev) => {
        const next = { ...prev };
        delete next[review.review_id];
        return next;
      });
      await reload();
    } catch (err) {
      setSaveErrorId(review.review_id);
      if (err instanceof ReviewError && err.message.includes('empty_reply')) {
        // already handled
      }
    } finally {
      setSavingId(null);
    }
  }

  function filterButtons() {
    return (
      <div style={styles.listFilters} role="tablist" aria-label={t('ownerReviews.filterLabel')}>
        {(['all', 'pending', 'replied'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            style={{
              ...styles.listFilterChip,
              ...(filter === key ? styles.listFilterChipActive : {}),
            }}
            onClick={() => setFilter(key)}
          >
            {t(`ownerReviews.filter${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
          </button>
        ))}
      </div>
    );
  }

  if (loading) {
    return <p style={styles.hint}>{t('ownerReviews.loading')}</p>;
  }
  if (error) {
    return <p style={styles.error}>{t('ownerReviews.errorLoad')}</p>;
  }

  if (reviews.length === 0) {
    return (
      <div>
        {filterButtons()}
        <p style={styles.hint}>{t('ownerReviews.empty')}</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div>
        {filterButtons()}
        <p style={styles.hint}>{t('ownerReviews.emptyFilter')}</p>
      </div>
    );
  }

  return (
    <div>
      {filterButtons()}
      <div style={styles.list}>
        {filtered.map((review) => {
          const hasReply = Boolean(review.owner_reply_body?.trim());
          const busy = savingId === review.review_id;
          const replyDraft = draft[review.review_id] ?? review.owner_reply_body ?? '';
          const orderRef = formatOrderRef(review.store_code, review.order_number);

          return (
            <article key={review.review_id} style={styles.card}>
              <header style={styles.cardTop}>
                <div>
                  <span style={styles.productName}>{review.product_name}</span>
                  <span style={styles.meta}>
                    {orderRef} · {formatClaimDateTime(review.created_at)}
                  </span>
                </div>
                {!hasReply && <span style={styles.badgePending}>{t('ownerReviews.badgePending')}</span>}
                {hasReply && <span style={styles.badgeDone}>{t('ownerReviews.badgeReplied')}</span>}
              </header>

              <div style={styles.ratingRow}>
                <span style={styles.stars} aria-label={t('ownerReviews.ratingAria', { rating: String(review.rating) })}>
                  {starsLabel(review.rating)}
                </span>
                <span style={styles.nickname}>{review.reviewer_nickname ?? t('ownerReviews.anonymous')}</span>
              </div>

              <p style={styles.body}>{review.body}</p>

              {review.image_urls.length > 0 && (
                <div style={styles.photoRow}>
                  {review.image_urls.map((url) => (
                    <img key={url} src={url} alt="" style={styles.photo} />
                  ))}
                </div>
              )}

              <div style={styles.replyBox}>
                <label style={styles.replyLabel} htmlFor={`reply-${review.review_id}`}>
                  {t('ownerReviews.replyLabel')}
                </label>
                <textarea
                  id={`reply-${review.review_id}`}
                  style={styles.textarea}
                  rows={3}
                  value={replyDraft}
                  disabled={busy}
                  placeholder={t('ownerReviews.replyPlaceholder')}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [review.review_id]: e.target.value }))
                  }
                />
                {saveErrorId === review.review_id && (
                  <p style={styles.inlineError}>{t('ownerReviews.replyError')}</p>
                )}
                {hasReply && review.owner_reply_at && (
                  <p style={styles.replyMeta}>
                    {t('ownerReviews.repliedAt', { time: formatClaimDateTime(review.owner_reply_at) })}
                  </p>
                )}
                <button
                  type="button"
                  style={styles.saveBtn}
                  disabled={busy}
                  onClick={() => void handleSave(review)}
                >
                  {busy ? t('ownerReviews.saving') : hasReply ? t('ownerReviews.updateReply') : t('ownerReviews.submitReply')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  hint: { color: oc.textMuted, fontSize: fs.sm, fontFamily: ownerFont, margin: 0 },
  error: { color: oc.danger, fontSize: fs.sm, fontFamily: ownerFont },
  listFilters: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  listFilterChip: {
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${oc.border}`,
    background: oc.surface,
    color: oc.textSecondary,
    fontSize: fs.sm,
    fontFamily: ownerFont,
    cursor: 'pointer',
  },
  listFilterChipActive: {
    borderColor: oc.primary,
    background: oc.navActiveBg,
    color: oc.primary,
    fontWeight: 600,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: {
    border: `1px solid ${oc.border}`,
    borderRadius: 12,
    padding: 16,
    background: oc.surface,
    fontFamily: ownerFont,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  productName: { display: 'block', fontWeight: 700, fontSize: fs.base, color: oc.text },
  meta: { display: 'block', fontSize: fs.sm, color: oc.textMuted, marginTop: 4 },
  badgePending: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 6,
    background: '#fef3c7',
    color: '#92400e',
  },
  badgeDone: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 6,
    background: oc.navActiveBg,
    color: oc.primary,
  },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  stars: { color: '#f59e0b', fontSize: 14, letterSpacing: 1 },
  nickname: { fontSize: fs.sm, color: oc.textMuted },
  body: { margin: '0 0 10px', fontSize: fs.sm, color: oc.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  photoRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  photo: { width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: `1px solid ${oc.border}` },
  replyBox: { marginTop: 8, paddingTop: 12, borderTop: `1px solid ${oc.border}` },
  replyLabel: { display: 'block', fontSize: fs.sm, fontWeight: 600, color: oc.text, marginBottom: 6 },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    padding: 10,
    fontSize: fs.sm,
    fontFamily: ownerFont,
    resize: 'vertical',
    minHeight: 72,
    background: oc.surface,
    color: oc.text,
  },
  inlineError: { color: oc.danger, fontSize: fs.xs, margin: '6px 0 0' },
  replyMeta: { fontSize: fs.xs, color: oc.textMuted, margin: '6px 0 0' },
  saveBtn: {
    marginTop: 10,
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontWeight: 600,
    fontSize: fs.sm,
    fontFamily: ownerFont,
    cursor: 'pointer',
  },
};
