import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import type { OwnerProductSectionSaveHandle } from '../lib/ownerProductSectionSave';
import { getOwnerProductTags, saveOwnerProductTags } from '../lib/productTags';
import { t } from '../i18n';
import '../styles/owner-product-edit.css';

const MAX_TAGS = 12;

function parseTagsInput(raw: string): string[] {
  const parts = raw.split(/[,，\n]+/);
  const out: string[] = [];
  for (const p of parts) {
    const label = p.trim();
    if (!label) continue;
    if (out.includes(label)) continue;
    out.push(label.slice(0, 24));
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

interface OwnerProductTagsEditorProps {
  productId: string;
}

export const OwnerProductTagsEditor = forwardRef<OwnerProductSectionSaveHandle, OwnerProductTagsEditorProps>(
  function OwnerProductTagsEditor({ productId }, ref) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const preview = useMemo(() => parseTagsInput(input), [input]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getOwnerProductTags(productId)
      .then((labels) => {
        if (mounted) setInput(labels.join(', '));
      })
      .catch(() => {
        if (mounted) setError(t('ownerProducts.productTagsLoadError'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [productId]);

  async function persistTags(): Promise<void> {
    if (loading) return;
    await saveOwnerProductTags(productId, preview);
    setSaved(true);
  }

  useImperativeHandle(ref, () => ({
    save: async () => {
      setSaving(true);
      setError(null);
      setSaved(false);
      try {
        await persistTags();
      } catch {
        setError(t('ownerProducts.productTagsSaveError'));
        throw new Error('product_tags_save_failed');
      } finally {
        setSaving(false);
      }
    },
  }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await persistTags();
    } catch {
      setError(t('ownerProducts.productTagsSaveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="owner-linked-panel">
      <h4 className="owner-linked-panel__title">{t('ownerProducts.productTagsLabel')}</h4>
      <p className="owner-linked-panel__hint">{t('ownerProducts.productTagsHint', { max: String(MAX_TAGS) })}</p>
      {loading ? (
        <p className="owner-linked-panel__hint">{t('ownerProducts.productTagsLoading')}</p>
      ) : (
        <>
          <textarea
            className="owner-product-tags__input"
            rows={2}
            value={input}
            onChange={(e) => {
              setSaved(false);
              setInput(e.target.value);
            }}
            placeholder={t('ownerProducts.productTagsPlaceholder')}
          />
          {preview.length > 0 && (
            <div className="owner-product-tags__preview" aria-label={t('ownerProducts.productTagsPreview')}>
              {preview.map((label) => (
                <span key={label} className="owner-product-tags__chip">
                  {label}
                </span>
              ))}
            </div>
          )}
          <p className="owner-linked-panel__hint">
            {t('ownerProducts.productTagsCount', { n: String(preview.length), max: String(MAX_TAGS) })}
          </p>
          <div className="owner-linked-actions">
            <button
              type="button"
              className="owner-btn-ghost owner-linked-save-btn owner-linked-save-btn--section"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? t('ownerProducts.productTagsSaving') : t('ownerProducts.productTagsSaveSection')}
            </button>
            {saved && <span className="owner-linked-saved">{t('ownerProducts.productTagsSaved')}</span>}
          </div>
          {error && <p className="owner-linked-error">{error}</p>}
        </>
      )}
    </div>
  );
});
