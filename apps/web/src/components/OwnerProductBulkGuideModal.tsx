import { createPortal } from 'react-dom';
import { useOverlayScrollLock } from '../hooks/useOverlayScrollLock';
import { t } from '../i18n';
import '../styles/owner-product-bulk-guide.css';

const GUIDE_IMAGES = [
  { src: '/guides/bulk-upload/04-three-steps.svg', key: 'steps' },
  { src: '/guides/bulk-upload/01-one-row-one-sku.svg', key: 'oneRow' },
  { src: '/guides/bulk-upload/02-options-wrong-vs-right.svg', key: 'options' },
  { src: '/guides/bulk-upload/03-fill-first-row.svg', key: 'fillRow' },
] as const;

interface OwnerProductBulkGuideModalProps {
  open: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
}

export function OwnerProductBulkGuideModal({
  open,
  onClose,
  onDownloadTemplate,
}: OwnerProductBulkGuideModalProps) {
  useOverlayScrollLock(open);

  if (!open) return null;

  return createPortal(
    <div
      className="owner-bulk-guide-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="owner-bulk-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-bulk-guide-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="owner-bulk-guide__head">
          <h2 id="owner-bulk-guide-title">{t('ownerProducts.bulkGuideTitle')}</h2>
          <button type="button" className="owner-bulk-guide__close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </header>

        <div className="owner-bulk-guide__body">
          <p className="owner-bulk-guide__lead">{t('ownerProducts.bulkGuideLead')}</p>

          {GUIDE_IMAGES.map((img, i) => (
            <section key={img.key} className="owner-bulk-guide__section">
              <h3 className="owner-bulk-guide__section-title">
                {t(`ownerProducts.bulkGuideSection${i + 1}Title`)}
              </h3>
              <p className="owner-bulk-guide__section-text">
                {t(`ownerProducts.bulkGuideSection${i + 1}Text`)}
              </p>
              <img
                className="owner-bulk-guide__figure"
                src={img.src}
                alt={t(`ownerProducts.bulkGuideSection${i + 1}Alt`)}
                loading="lazy"
                decoding="async"
              />
            </section>
          ))}

          <ul className="owner-bulk-guide__checklist">
            <li>{t('ownerProducts.bulkGuideCheck1')}</li>
            <li>{t('ownerProducts.bulkGuideCheck2')}</li>
            <li>{t('ownerProducts.bulkGuideCheck3')}</li>
          </ul>
        </div>

        <footer className="owner-bulk-guide__foot">
          {onDownloadTemplate && (
            <button type="button" className="owner-bulk-guide__btn" onClick={onDownloadTemplate}>
              {t('ownerProducts.bulkDownloadTemplate')}
            </button>
          )}
          <button type="button" className="owner-bulk-guide__btn owner-bulk-guide__btn--primary" onClick={onClose}>
            {t('ownerProducts.bulkGuideClose')}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
