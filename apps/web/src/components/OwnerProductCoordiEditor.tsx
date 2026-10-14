import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import type { OwnerProductSectionSaveHandle } from '../lib/ownerProductSectionSave';
import type { Product } from '@popup-cube/shared';
import {
  getOwnerProductCoordiLinkIds,
  saveOwnerProductCoordiLinks,
} from '../lib/productCoordi';
import { t } from '../i18n';
import '../styles/owner-product-edit.css';
import '../styles/owner-product-linked-recommend.css';

const MAX_LINKS = 12;

interface OwnerProductCoordiEditorProps {
  productId: string;
  products: Product[];
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

export const OwnerProductCoordiEditor = forwardRef<OwnerProductSectionSaveHandle, OwnerProductCoordiEditorProps>(
  function OwnerProductCoordiEditor({ productId, products }, ref) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const candidates = useMemo(
    () => products.filter((p) => p.id !== productId),
    [products, productId]
  );

  const selectedProducts = useMemo(
    () => selected.map((id) => byId.get(id)).filter((p): p is Product => !!p),
    [selected, byId]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getOwnerProductCoordiLinkIds(productId)
      .then((ids) => {
        if (mounted) setSelected(ids);
      })
      .catch(() => {
        if (mounted) setError(t('ownerProducts.linkedRecommendLoadError'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [productId]);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_LINKS) return prev;
      return [...prev, id];
    });
  }

  function remove(id: string) {
    setSaved(false);
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  async function persistLinks(): Promise<void> {
    if (loading) return;
    await saveOwnerProductCoordiLinks(productId, selected);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  useImperativeHandle(ref, () => ({
    save: async () => {
      setSaving(true);
      setError(null);
      setSaved(false);
      try {
        await persistLinks();
      } catch {
        setError(t('ownerProducts.linkedRecommendSaveError'));
        throw new Error('coordi_save_failed');
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
      await persistLinks();
    } catch {
      setError(t('ownerProducts.linkedRecommendSaveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="owner-linked-panel">
        <p className="owner-linked-panel__hint">{t('ownerProducts.linkedRecommendLoading')}</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="owner-linked-panel">
        <h4 className="owner-linked-panel__title">{t('ownerProducts.linkedRecommendLabel')}</h4>
        <p className="owner-linked-panel__hint">{t('ownerProducts.linkedRecommendNeedMore')}</p>
      </div>
    );
  }

  return (
    <div className="owner-linked-panel">
      <div className="owner-linked-panel__head">
        <h4 className="owner-linked-panel__title">{t('ownerProducts.linkedRecommendLabel')}</h4>
        <span className="owner-linked-panel__count">
          {t('ownerProducts.linkedRecommendCount', {
            n: String(selected.length),
            max: String(MAX_LINKS),
          })}
        </span>
      </div>
      <p className="owner-linked-panel__hint">{t('ownerProducts.linkedRecommendHint', { max: String(MAX_LINKS) })}</p>

      {selectedProducts.length > 0 && (
        <div className="owner-linked-selected">
          <p className="owner-linked-selected__label">{t('ownerProducts.linkedRecommendOrder')}</p>
          <div className="owner-linked-selected__row">
            {selectedProducts.map((p, idx) => (
              <div key={p.id} className="owner-linked-chip">
                <span className="owner-linked-chip__order">{idx + 1}</span>
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="owner-linked-chip__thumb" />
                ) : (
                  <span className="owner-linked-chip__thumb-ph">🛍️</span>
                )}
                <div className="owner-linked-chip__meta">
                  <span className="owner-linked-chip__name">{p.name}</span>
                  <span className="owner-linked-chip__price">{formatPrice(p.price)}</span>
                </div>
                <button
                  type="button"
                  className="owner-linked-chip__remove"
                  aria-label={t('ownerProducts.linkedRecommendRemove')}
                  onClick={() => remove(p.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="owner-linked-selected__label">{t('ownerProducts.linkedRecommendPick')}</p>
      <div className="owner-linked-grid">
        {candidates.map((p) => {
          const active = selected.includes(p.id);
          const disabled = !active && selected.length >= MAX_LINKS;
          return (
            <button
              key={p.id}
              type="button"
              className={active ? 'owner-linked-card owner-linked-card--active' : 'owner-linked-card'}
              disabled={disabled}
              onClick={() => toggle(p.id)}
            >
              {active && <span className="owner-linked-card__check">✓</span>}
              <div className="owner-linked-card__thumb-wrap">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="owner-linked-card__thumb" />
                ) : (
                  <span style={{ fontSize: 28, opacity: 0.45 }}>🛍️</span>
                )}
              </div>
              <div className="owner-linked-card__body">
                <p className="owner-linked-card__name">{p.name}</p>
                <p className="owner-linked-card__price">{formatPrice(p.price)}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="owner-linked-actions">
        <button
          type="button"
          className="owner-btn-ghost owner-linked-save-btn owner-linked-save-btn--section"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? t('ownerProducts.linkedRecommendSaving') : t('ownerProducts.linkedRecommendSaveSection')}
        </button>
        {saved && <span className="owner-linked-saved">{t('ownerProducts.linkedRecommendSaved')}</span>}
      </div>
      {error && <p className="owner-linked-error">{error}</p>}
    </div>
  );
});
