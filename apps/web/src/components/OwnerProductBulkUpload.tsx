import { useEffect, useRef, useState } from 'react';
import { listMyProducts } from '../lib/products';
import {
  downloadBulkProductTemplate,
  preloadBulkProductTemplate,
  resetBulkProductTemplateCache,
} from '../lib/bulkProductUpload/downloadBulkProductTemplate';
import { importBulkProductGroups } from '../lib/bulkProductUpload/importBulkProductGroups';
import { parseBulkProductXlsx } from '../lib/bulkProductUpload/parseBulkProductXlsx';
import { t } from '../i18n';
import { OwnerProductBulkGuideModal } from './OwnerProductBulkGuideModal';
import '../styles/owner-product-bulk-upload.css';

interface OwnerProductBulkUploadProps {
  storeId: string;
  userId: string;
  onImported: () => void;
  /** 상품 툴바 안에 붙일 때 */
  layout?: 'toolbar';
}

export function OwnerProductBulkUpload({
  storeId,
  userId,
  onImported,
  layout = 'toolbar',
}: OwnerProductBulkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([]);
  const [importErrors, setImportErrors] = useState<
    { row: number; productLabel: string; message: string }[]
  >([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (open) preloadBulkProductTemplate();
  }, [open]);

  async function handleDownloadTemplate() {
    setTemplateBusy(true);
    setTemplateError(null);
    try {
      await downloadBulkProductTemplate();
    } catch {
      resetBulkProductTemplateCache();
      setTemplateError(t('ownerProducts.bulkDownloadFailed'));
    } finally {
      setTemplateBusy(false);
    }
  }

  async function handleFile(file: File) {
    setBusy(true);
    setParseErrors([]);
    setImportErrors([]);
    setSummary(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseBulkProductXlsx(buffer);
      if (parsed.errors.length > 0) {
        setParseErrors(parsed.errors);
        return;
      }
      if (parsed.groups.length === 0) {
        setParseErrors([{ row: 0, message: t('ownerProducts.bulkEmpty') }]);
        return;
      }
      const existing = await listMyProducts(storeId);
      const result = await importBulkProductGroups(userId, storeId, parsed.groups, existing);
      setImportErrors(result.errors);
      setSummary(
        t('ownerProducts.bulkDone', {
          created: String(result.created),
          updated: String(result.updated),
        })
      );
      if (result.errors.length === 0 || result.created + result.updated > 0) {
        onImported();
      }
    } catch {
      setParseErrors([{ row: 0, message: t('ownerProducts.bulkReadError') }]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const rootClass = [
    'owner-bulk-upload',
    layout === 'toolbar' ? 'owner-bulk-upload--toolbar' : '',
    open && layout === 'toolbar' ? 'owner-bulk-upload--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={rootClass}>
      <div className="owner-bulk-upload__toolbar-row">
        <button
          type="button"
          className="owner-bulk-upload__menu-btn"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {t('ownerProducts.bulkMenuLabel')}
          <span className="owner-bulk-upload__chevron" aria-hidden>
            {open ? '▴' : '▾'}
          </span>
        </button>
      </div>

      <OwnerProductBulkGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onDownloadTemplate={() => void handleDownloadTemplate()}
      />

      {open && (
        <div className="owner-bulk-upload__card">
          <div className="owner-bulk-upload__card-head">
            <h4 className="owner-bulk-upload__title">{t('ownerProducts.bulkTitle')}</h4>
          </div>
          <p className="owner-bulk-upload__tip">{t('ownerProducts.bulkIntro')}</p>
          <div className="owner-bulk-upload__actions">
            <button
              type="button"
              className="owner-bulk-upload__btn"
              onClick={() => setGuideOpen(true)}
            >
              {t('ownerProducts.bulkGuideBtn')}
            </button>
            <button
              type="button"
              className="owner-bulk-upload__btn"
              disabled={templateBusy}
              onClick={() => void handleDownloadTemplate()}
            >
              {templateBusy ? t('ownerProducts.bulkDownloadPreparing') : t('ownerProducts.bulkDownloadTemplate')}
            </button>
            <button
              type="button"
              className="owner-bulk-upload__btn owner-bulk-upload__btn--primary"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? t('ownerProducts.bulkUploading') : t('ownerProducts.bulkUpload')}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="owner-bulk-upload__file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </div>

          {templateError && <p className="owner-bulk-upload__template-error">{templateError}</p>}

          {summary && <p className="owner-bulk-upload__summary">{summary}</p>}

          {(parseErrors.length > 0 || importErrors.length > 0) && (
            <ul className="owner-bulk-upload__errors">
              {parseErrors.map((err, i) => (
                <li key={`p-${i}`}>
                  {err.row > 0
                    ? t('ownerProducts.bulkErrorRow', { row: String(err.row), message: err.message })
                    : err.message}
                </li>
              ))}
              {importErrors.map((err, i) => (
                <li key={`i-${i}`}>
                  {t('ownerProducts.bulkErrorProduct', {
                    row: String(err.row),
                    product: err.productLabel,
                    message: err.message,
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
