import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { getOwnerProductSkus, saveOwnerProductSkus, type OwnerSkuRow } from '../lib/productSkus';
import { formatIntegerDisplay, formatIntegerInputRaw, parseIntegerInput } from '../lib/formatInteger';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerProductSkusEditorProps {
  productId: string;
  basePrice: number;
}

function emptyRow(): OwnerSkuRow {
  return { color: '', size: '', stock_quantity: 0, price_delta: 0 };
}

function parseSignedDelta(raw: string): number {
  const cleaned = raw.replace(/\s/g, '').replace(/,/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '+') return 0;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

function formatSignedDeltaDisplay(value: number): string {
  if (!value) return '';
  return value.toLocaleString('ko-KR');
}

export function OwnerProductSkusEditor({ productId, basePrice }: OwnerProductSkusEditorProps) {
  const [rows, setRows] = useState<OwnerSkuRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const activeRows = useMemo(
    () => rows.filter((r) => r.color.trim() || r.size.trim()),
    [rows]
  );
  const totalOptionStock = useMemo(
    () => activeRows.reduce((sum, r) => sum + Math.max(0, r.stock_quantity), 0),
    [activeRows]
  );

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
              price_delta: s.price_delta ?? 0,
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
      <p style={styles.intro}>{t('ownerProducts.skusStockNote')}</p>
      {activeRows.length > 0 && (
        <p style={styles.summary}>
          {t('ownerProducts.skusStockSum', { count: totalOptionStock })}
        </p>
      )}

      <div style={styles.tableHead}>
        <span style={styles.thColor}>{t('ownerProducts.skusColorPh')}</span>
        <span style={styles.thSize}>{t('ownerProducts.skusSizePh')}</span>
        <span style={styles.thStock}>{t('ownerProducts.skusColStock')}</span>
        <span style={styles.thDelta}>{t('ownerProducts.skusColPriceDelta')}</span>
        <span style={styles.thSale}>{t('ownerProducts.skusColSalePrice')}</span>
        <span style={styles.thAction} />
      </div>

      {rows.map((row, idx) => {
        const salePrice = basePrice + (row.price_delta ?? 0);
        return (
          <div key={idx} style={styles.row}>
            <input
              style={styles.inputColor}
              placeholder={t('ownerProducts.skusColorPh')}
              value={row.color}
              onChange={(e) =>
                setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, color: e.target.value } : r)))
              }
              maxLength={40}
            />
            <input
              style={styles.inputSize}
              placeholder={t('ownerProducts.skusSizePh')}
              value={row.size}
              onChange={(e) =>
                setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, size: e.target.value } : r)))
              }
              maxLength={40}
            />
            <input
              style={styles.inputStock}
              placeholder="0"
              value={row.stock_quantity ? formatIntegerDisplay(row.stock_quantity) : ''}
              onChange={(e) => {
                const n = parseIntegerInput(formatIntegerInputRaw(e.target.value));
                setRows((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, stock_quantity: Number.isFinite(n) ? n : 0 } : r))
                );
              }}
              inputMode="numeric"
            />
            <input
              style={styles.inputDelta}
              placeholder={t('ownerProducts.skusDeltaPh')}
              value={formatSignedDeltaDisplay(row.price_delta)}
              onChange={(e) => {
                const n = parseSignedDelta(e.target.value);
                setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, price_delta: n } : r)));
              }}
              inputMode="numeric"
            />
            <span style={styles.salePreview}>
              {salePrice >= 0 ? `${salePrice.toLocaleString('ko-KR')}원` : '—'}
            </span>
            {rows.length > 1 && (
              <button type="button" style={styles.removeBtn} onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}>
                {t('ownerProducts.skusRemoveRow')}
              </button>
            )}
          </div>
        );
      })}

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
  intro: { margin: '0 0 8px', fontSize: fs.xs, color: oc.textMuted, lineHeight: 1.5 },
  summary: { margin: '0 0 10px', fontSize: fs.xs, fontWeight: 600, color: oc.text },
  hint: { fontSize: fs.sm, color: oc.textMuted },
  tableHead: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 72px 88px 88px 52px',
    gap: 6,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 600,
    color: oc.textMuted,
  },
  thColor: { gridColumn: '1' },
  thSize: { gridColumn: '2' },
  thStock: { gridColumn: '3' },
  thDelta: { gridColumn: '4' },
  thSale: { gridColumn: '5' },
  thAction: { gridColumn: '6' },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 72px 88px 88px 52px',
    gap: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  inputColor: {
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
  },
  inputSize: {
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
  },
  inputStock: {
    padding: '8px 6px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
    width: '100%',
  },
  inputDelta: {
    padding: '8px 6px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
    width: '100%',
  },
  salePreview: { fontSize: 11, color: oc.textMuted, whiteSpace: 'nowrap' },
  removeBtn: {
    padding: '6px 8px',
    border: `1px solid ${oc.border}`,
    background: oc.surface,
    borderRadius: 8,
    fontSize: 10,
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
