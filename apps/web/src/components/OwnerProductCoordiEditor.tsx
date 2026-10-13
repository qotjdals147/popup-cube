import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import {
  getOwnerProductCoordiLinkIds,
  saveOwnerProductCoordiLinks,
} from '../lib/productCoordi';
import { t } from '../i18n';
import { ownerColors as oc, ownerFieldLabel, ownerFontSize as fs, ownerHelpText } from '../styles/ownerAdminTheme';

const MAX_LINKS = 12;

interface OwnerProductCoordiEditorProps {
  productId: string;
  products: Product[];
}

export function OwnerProductCoordiEditor({ productId, products }: OwnerProductCoordiEditorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const candidates = useMemo(
    () => products.filter((p) => p.id !== productId),
    [products, productId]
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
        if (mounted) setError(t('ownerProducts.coordiLoadError'));
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

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveOwnerProductCoordiLinks(productId, selected);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(t('ownerProducts.coordiSaveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ ...ownerHelpText, marginTop: 8 }}>{t('ownerProducts.coordiLoading')}</p>;
  }

  if (candidates.length === 0) {
    return (
      <p style={{ ...ownerHelpText, marginTop: 8 }}>{t('ownerProducts.coordiNeedMoreProducts')}</p>
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      <label style={ownerFieldLabel}>{t('ownerProducts.coordiLabel')}</label>
      <p style={ownerHelpText}>{t('ownerProducts.coordiHelp', { max: String(MAX_LINKS) })}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {candidates.map((p) => {
          const checked = selected.includes(p.id);
          const disabled = !checked && selected.length >= MAX_LINKS;
          return (
            <label
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: fs.base,
                color: oc.text,
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(p.id)} />
              <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
              <span style={{ color: oc.textMuted, fontSize: fs.sm }}>
                {p.price.toLocaleString('ko-KR')}원
              </span>
            </label>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: `1px solid ${oc.border}`,
            background: oc.surface,
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? t('ownerProducts.coordiSaving') : t('ownerProducts.coordiSave')}
        </button>
        {saved && <span style={{ color: oc.success, fontSize: fs.sm }}>{t('ownerProducts.coordiSaved')}</span>}
      </div>
      {error && <p style={{ color: oc.danger, fontSize: fs.sm, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
