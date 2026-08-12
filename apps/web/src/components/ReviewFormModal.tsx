import { useEffect, useRef, useState } from 'react';
import { MAX_REVIEW_IMAGES, ReviewError, submitProductReview } from '../lib/reviews';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

interface ReviewFormModalProps {
  orderId: string;
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

/** §54 — 구매확정된 주문 상품에 별점·글·사진 리뷰를 남기는 창 (「내 주문」에서 진입). */
export function ReviewFormModal({ orderId, productId, productName, onClose, onSubmitted }: ReviewFormModalProps) {
  const { userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setFiles((prev) => {
      const next = [...prev, ...picked].slice(0, MAX_REVIEW_IMAGES);
      return next;
    });
    setPreviews((prev) => {
      const nextUrls = picked.map((f) => URL.createObjectURL(f));
      return [...prev, ...nextUrls].slice(0, MAX_REVIEW_IMAGES);
    });
    e.target.value = '';
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function reviewErrorMessage(err: unknown): string {
    if (err instanceof ReviewError) {
      if (err.message === 'invalid_rating') return t('review.errorInvalidRating');
      if (err.message === 'empty_body') return t('review.errorEmptyBody');
      if (err.message === 'already_reviewed') return t('review.errorAlreadyReviewed');
      if (err.message === 'purchase_not_confirmed') return t('review.errorPurchaseNotConfirmed');
    }
    return t('review.errorGeneric');
  }

  async function handleSubmit() {
    if (!userId) return;
    if (rating < 1) {
      setError(t('review.errorInvalidRating'));
      return;
    }
    if (!body.trim()) {
      setError(t('review.errorEmptyBody'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitProductReview(userId, { orderId, productId, rating, body, imageFiles: files });
      onSubmitted();
    } catch (err) {
      setError(reviewErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('review.writeTitle')}</h3>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <p style={styles.productName}>{productName}</p>

        <label style={styles.fieldLabel}>{t('review.ratingLabel')}</label>
        <div style={styles.starRow} onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              style={styles.starButton}
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => setRating(n)}
              aria-label={`${n}점`}
            >
              {(hoverRating || rating) >= n ? '★' : '☆'}
            </button>
          ))}
        </div>

        <label style={styles.fieldLabel}>{t('review.bodyLabel')}</label>
        <textarea
          style={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('review.bodyPlaceholder')}
          maxLength={1000}
          rows={5}
        />

        <label style={styles.fieldLabel}>{t('review.photoLabel')}</label>
        <div style={styles.photoRow}>
          {previews.map((url, i) => (
            <div key={url} style={styles.photoThumbWrap}>
              <img src={url} alt="" style={styles.photoThumb} />
              <button type="button" style={styles.photoRemove} onClick={() => removeFile(i)}>
                ✕
              </button>
            </div>
          ))}
          {files.length < MAX_REVIEW_IMAGES && (
            <button type="button" style={styles.photoAddButton} onClick={() => fileInputRef.current?.click()}>
              {t('review.photoAdd')}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button type="button" style={styles.cancelButton} onClick={onClose}>
            {t('review.cancel')}
          </button>
          <button type="button" style={styles.submitButton} disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? t('review.submitting') : t('review.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 70,
    padding: 16,
  },
  panel: {
    background: '#16213e',
    borderRadius: 14,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: 20,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { color: '#fff', fontSize: 17, margin: 0 },
  closeButton: { background: 'transparent', border: 'none', color: '#a0a0c0', fontSize: 16, cursor: 'pointer' },
  productName: { color: '#c9a962', fontSize: 13, fontWeight: 600, margin: '0 0 14px' },
  fieldLabel: { color: '#a0a0c0', fontSize: 12, display: 'block', margin: '10px 0 6px' },
  starRow: { display: 'flex', gap: 4 },
  starButton: {
    background: 'transparent',
    border: 'none',
    color: '#e9c46a',
    fontSize: 28,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#0d1730',
    color: '#fff',
    fontSize: 13,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  photoRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  photoThumbWrap: { position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%', objectFit: 'cover' },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.65)',
    color: '#fff',
    fontSize: 10,
    cursor: 'pointer',
    lineHeight: '18px',
    padding: 0,
  },
  photoAddButton: {
    width: 64,
    height: 64,
    borderRadius: 8,
    border: '1px dashed #4062a0',
    background: '#0d1730',
    color: '#8ca4d8',
    fontSize: 11,
    cursor: 'pointer',
  },
  error: { color: '#ff6b6b', fontSize: 12, margin: '10px 0 0' },
  actions: { display: 'flex', gap: 10, marginTop: 18 },
  cancelButton: {
    flex: 1,
    padding: '11px 12px',
    borderRadius: 8,
    border: '1px solid #4062a0',
    background: 'transparent',
    color: '#d8e4ff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    flex: 2,
    padding: '11px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
