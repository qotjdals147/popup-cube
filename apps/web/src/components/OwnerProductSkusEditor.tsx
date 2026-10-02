import { useEffect, useState, type CSSProperties } from 'react';
import { getOwnerProductSkus, saveOwnerProductSkus, type OwnerSkuRow } from '../lib/productSkus';
import { formatIntegerDisplay, formatIntegerInputRaw, parseIntegerInput } from '../lib/formatInteger';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerProductSkusEditorProps {
  productId: string;
}

function emptyRow(): OwnerSkuRow {
  return { color: '', size: '', stock_quantity: 0 };
}

export function OwnerProductSkusEditor({ productId }: OwnerProductSkusEditorProps) {
  const [rows, setRows] = useState<OwnerSkuRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await getOwnerProductSkus(productId);
        if (cancelled) return;
        if (data.length === 0) {
          setRows([emptyRow()]);
        } else {
          setRows(
            data.map((s) => ({
              color: s.color ?? '',
              size: s.size ?? '',
              stock_quantity: s.stock_quantity,
            }))
          );
        }
      } catch {
        if (!cancelled) setErr(t('ownerProducts.skusLoadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      await saveOwnerProductSkus(productId, rows);
      setMsg(t('ownerProducts.skusSaved'));
    } catch {
      setErr(t('ownerProducts.skusSaveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={styles.hint}>{t('ownerProducts.skusLoading')}</p>;
  }

  return (
    <div style={styles.box}>
      <h4 style={styles.title}>{t('ownerProducts.skusTitle')}</h4>
      <p style={styles.intro}>{t('ownerProducts.skusIntro')}</p>
      {rows.map((row, idx) => (
        <div key={idx} style={styles.row}>
          <input
            style={styles.input}
            placeholder={t('ownerProducts.skusColorPh')}
            value={row.color}
            onChange={(e) =>
              setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, color: e.target.value } : r)))
            }
            maxLength={40}
          />
          <input
            style={styles.input}
            placeholder={t('ownerProducts.skusSizePh')}
            value={row.size}
            onChange={(e) =>
              setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, size: e.target.value } : r)))
            }
            maxLength={40}
          />
          <input
            style={styles.inputStock}
            placeholder={t('ownerProducts.stockPlaceholder')}
            value={row.stock_quantity ? formatIntegerDisplay(row.stock_quantity) : ''}
            onChange={(e) => {
              const n = parseIntegerInput(formatIntegerInputRaw(e.target.value));
              setRows((prev) =>
                prev.map((r, i) => (i === idx ? { ...r, stock_quantity: Number.isFinite(n) ? n : 0 } : r))
              );
            }}
            inputMode="numeric"
          />
          {rows.length > 1 && (
            <button type="button" style={styles.removeBtn} onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}>
              {t('ownerProducts.skusRemoveRow')}
            </button>
          )}
        </div>
      ))}
      <div style={styles.actions}>
        <button type="button" style={styles.addBtn} onClick={() => setRows((p) => [...p, emptyRow()])}>
          {t('ownerProducts.skusAddRow')}
        </button>
        <button type="button" style={styles.saveBtn} disabled={saving} onClick={() => void handleSave()}>
          {saving ? t('ownerProducts.submitting') : t('ownerProducts.skusSave')}
        </button>
      </div>
      {msg && <p style={styles.ok}>{msg}</p>}
      {err && <p style={styles.error}>{err}</p>}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  box: {
    marginTop: 12,
    padding: '12px 0',
    borderTop: `1px solid ${oc.border}`,
  },
  title: { margin: '0 0 4px', fontSize: fs.sm, fontWeight: 700, color: oc.text },
  intro: { margin: '0 0 10px', fontSize: fs.xs, color: oc.textMuted, lineHeight: 1.5 },
  hint: { fontSize: fs.sm, color: oc.textMuted },
  row: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8, alignItems: 'center' },
  input: {
    flex: '1 1 100px',
    minWidth: 80,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
  },
  inputStock: {
    width: 96,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
  },
  removeBtn: {
    padding: '6px 10px',
    border: `1px solid ${oc.border}`,
    background: oc.surface,
    borderRadius: 8,
    fontSize: fs.xs,
    cursor: 'pointer',
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  addBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surfaceMuted,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  ok: { margin: '8px 0 0', fontSize: fs.xs, color: oc.successText },
  error: { margin: '8px 0 0', fontSize: fs.xs, color: oc.dangerText },
};
