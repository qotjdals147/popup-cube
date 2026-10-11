import { useRef, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import { listMyProducts } from '../lib/products';
import { downloadBulkProductTemplate } from '../lib/bulkProductUpload/downloadBulkProductTemplate';
import { importBulkProductGroups } from '../lib/bulkProductUpload/importBulkProductGroups';
import { parseBulkProductXlsx } from '../lib/bulkProductUpload/parseBulkProductXlsx';
import { t } from '../i18n';
import '../styles/owner-product-bulk-upload.css';

interface OwnerProductBulkUploadProps {
  storeId: string;
  userId: string;
  onImported: () => void;
}

export function OwnerProductBulkUpload({ storeId, userId, onImported }: OwnerProductBulkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([]);
  const [importErrors, setImportErrors] = useState<
    { row: number; productLabel: string; message: string }[]
  >([]);
  const [summary, setSummary] = useState<string | null>(null);

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
      if (result.errors.length === 0) {
        onImported();
      } else if (result.created + result.updated > 0) {
        onImported();
      }
    } catch {
      setParseErrors([{ row: 0, message: t('ownerProducts.bulkReadError') }]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <section className="owner-bulk-upload">
      <button
        type="button"
        className="owner-bulk-upload__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? t('ownerProducts.bulkCollapse') : t('ownerProducts.bulkExpand')}
      </button>

      {open && (
        <div className="owner-bulk-upload__panel">
          <p className="owner-bulk-upload__intro">{t('ownerProducts.bulkIntro')}</p>
          <div className="owner-bulk-upload__actions">
            <button type="button" className="owner-bulk-upload__btn" onClick={() => downloadBulkProductTemplate()}>
              {t('ownerProducts.bulkDownloadTemplate')}
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
