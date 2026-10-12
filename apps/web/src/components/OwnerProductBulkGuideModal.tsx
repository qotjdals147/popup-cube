import { createPortal } from 'react-dom';
import { useOverlayScrollLock } from '../hooks/useOverlayScrollLock';
import { t } from '../i18n';
import { BULK_GUIDE_FIGURES } from './bulkUploadGuideFigures';
import '../styles/owner-product-bulk-guide.css';

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
    <div className="owner-bulk-guide-backdrop" role="presentation" onClick={onClose}>
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
          <dl className="owner-bulk-guide__terms">
            <div>
              <dt>{t('ownerProducts.bulkGuideTermProduct')}</dt>
              <dd>{t('ownerProducts.bulkGuideTermProductDesc')}</dd>
            </div>
            <div>
              <dt>{t('ownerProducts.bulkGuideTermRow')}</dt>
              <dd>{t('ownerProducts.bulkGuideTermRowDesc')}</dd>
            </div>
          </dl>

          {BULK_GUIDE_FIGURES.map((Figure, i) => (
            <section key={i} className="owner-bulk-guide__section">
              <h3 className="owner-bulk-guide__section-title">
                {t(`ownerProducts.bulkGuideSection${i + 1}Title`)}
              </h3>
              <p className="owner-bulk-guide__section-text">
                {t(`ownerProducts.bulkGuideSection${i + 1}Text`)}
              </p>
              <Figure />
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
