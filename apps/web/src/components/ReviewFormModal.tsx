import { useEffect, useRef, useState } from 'react';
import { MAX_REVIEW_IMAGES, ReviewError, submitProductReview } from '../lib/reviews';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import '../styles/review-form.css';

interface ReviewFormModalProps {
  orderId: string;
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmitted: () => void;
  /** AD-065 — shop·/app/me = light (기본) · 월드 다크 overlay = dark */
  appearance?: 'light' | 'dark';
}

/** §54 — 구매확정된 주문 상품에 별점·글·사진 리뷰 (§60 라이트) */
export function ReviewFormModal({
  orderId,
  productId,
  productName,
  onClose,
  onSubmitted,
  appearance = 'light',
}: ReviewFormModalProps) {
  const { userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rootClass = appearance === 'light' ? 'review-form--light' : 'review-form--dark';

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
    <div className={`${rootClass} review-form-overlay`} onClick={onClose}>
      <div className="review-form-panel" onClick={(e) => e.stopPropagation()}>
        <div className="review-form-header">
          <h3 className="review-form-title">{t('review.writeTitle')}</h3>
          <button type="button" className="review-form-close" onClick={onClose} aria-label={t('review.cancel')}>
            ✕
          </button>
        </div>
        <p className="review-form-product-name">{productName}</p>

        <label className="review-form-field-label">{t('review.ratingLabel')}</label>
        <div className="review-form-star-row" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="review-form-star-btn"
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => setRating(n)}
              aria-label={`${n}점`}
            >
              {(hoverRating || rating) >= n ? '★' : '☆'}
            </button>
          ))}
        </div>

        <label className="review-form-field-label">{t('review.bodyLabel')}</label>
        <textarea
          className="review-form-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('review.bodyPlaceholder')}
          maxLength={1000}
          rows={5}
        />

        <label className="review-form-field-label">{t('review.photoLabel')}</label>
        <div className="review-form-photo-row">
          {previews.map((url, i) => (
            <div key={url} className="review-form-photo-thumb-wrap">
              <img src={url} alt="" className="review-form-photo-thumb" />
              <button type="button" className="review-form-photo-remove" onClick={() => removeFile(i)}>
                ✕
              </button>
            </div>
          ))}
          {files.length < MAX_REVIEW_IMAGES && (
            <button type="button" className="review-form-photo-add" onClick={() => fileInputRef.current?.click()}>
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

        {error && <p className="review-form-error">{error}</p>}

        <div className="review-form-actions">
          <button type="button" className="review-form-cancel" onClick={onClose}>
            {t('review.cancel')}
          </button>
          <button type="button" className="review-form-submit" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? t('review.submitting') : t('review.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
