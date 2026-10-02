import { useEffect, useMemo, useState } from 'react';
import { getOwnerProductSkus, saveOwnerProductSkus, type OwnerSkuRow } from '../lib/productSkus';
import { formatIntegerDisplay, formatIntegerInputRaw, parseIntegerInput } from '../lib/formatInteger';
import { t } from '../i18n';
import '../styles/owner-product-skus.css';

interface OwnerProductSkusEditorProps {
  productId: string;
  basePrice: number;
}

function emptyRow(): OwnerSkuRow {
  return { color: '', size: '', stock_quantity: 0, price_delta: 0 };
}

function rowKey(r: OwnerSkuRow): string {
  return `${r.color.trim().toLowerCase()}|${r.size.trim().toLowerCase()}`;
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

function parseOptionList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,，/\n|]+/)) {
    const v = part.trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function buildCombinations(colors: string[], sizes: string[]): OwnerSkuRow[] {
  if (colors.length === 0 && sizes.length === 0) return [];
  if (colors.length === 0) {
    return sizes.map((size) => ({ color: '', size, stock_quantity: 0, price_delta: 0 }));
  }
  if (sizes.length === 0) {
    return colors.map((color) => ({ color, size: '', stock_quantity: 0, price_delta: 0 }));
  }
  return colors.flatMap((color) =>
    sizes.map((size) => ({ color, size, stock_quantity: 0, price_delta: 0 }))
  );
}

function mergeGeneratedRows(existing: OwnerSkuRow[], generated: OwnerSkuRow[]): OwnerSkuRow[] {
  const byKey = new Map<string, OwnerSkuRow>();
  for (const r of existing) {
    if (!r.color.trim() && !r.size.trim()) continue;
    byKey.set(rowKey(r), r);
  }
  for (const g of generated) {
    const k = rowKey(g);
    if (!byKey.has(k)) byKey.set(k, g);
  }
  const merged = [...byKey.values()];
  return merged.length > 0 ? merged : [emptyRow()];
}

export function OwnerProductSkusEditor({ productId, basePrice }: OwnerProductSkusEditorProps) {
  const [rows, setRows] = useState<OwnerSkuRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bulkColors, setBulkColors] = useState('');
  const [bulkSizes, setBulkSizes] = useState('');

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

  function handleGenerateCombinations() {
    const colors = parseOptionList(bulkColors);
    const sizes = parseOptionList(bulkSizes);
    const generated = buildCombinations(colors, sizes);
    if (generated.length === 0) {
      setErr(t('ownerProducts.skusGenEmpty'));
      return;
    }
    setErr(null);
    setRows((prev) => mergeGeneratedRows(prev, generated));
    setMsg(t('ownerProducts.skusGenDone', { count: generated.length }));
  }

  function updateRow(idx: number, patch: Partial<OwnerSkuRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function removeRow(idx: number) {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : [emptyRow()];
    });
  }

  if (loading) {
    return <p className="owner-sku-msg-err">{t('ownerProducts.skusLoading')}</p>;
  }

  const basePriceLabel = basePrice.toLocaleString('ko-KR');

  return (
    <section className="owner-sku-panel" aria-labelledby="owner-sku-title">
      <div className="owner-sku-panel__head">
        <div>
          <h4 id="owner-sku-title" className="owner-sku-panel__title">
            {t('ownerProducts.skusTitle')}
          </h4>
          <p className="owner-sku-panel__base-price">
            {t('ownerProducts.skusBasePriceLabel')}{' '}
            <strong>{basePriceLabel}원</strong>
          </p>
        </div>
        {activeRows.length > 0 && (
          <span className="owner-sku-panel__badge">
            {t('ownerProducts.skusStockSum', { count: totalOptionStock })}
          </span>
        )}
      </div>

      <div className="owner-sku-panel__tips">
        <p>{t('ownerProducts.skusTipStock')}</p>
        <p>{t('ownerProducts.skusTipPrice')}</p>
      </div>

      <div className="owner-sku-gen">
        <p className="owner-sku-gen__title">{t('ownerProducts.skusGenTitle')}</p>
        <div className="owner-sku-gen__fields">
          <div>
            <label className="owner-sku-gen__label" htmlFor={`sku-bulk-colors-${productId}`}>
              {t('ownerProducts.skusGenColors')}
            </label>
            <input
              id={`sku-bulk-colors-${productId}`}
              className="owner-sku-gen__input"
              value={bulkColors}
              onChange={(e) => setBulkColors(e.target.value)}
              placeholder={t('ownerProducts.skusGenColorsPh')}
            />
          </div>
          <div>
            <label className="owner-sku-gen__label" htmlFor={`sku-bulk-sizes-${productId}`}>
              {t('ownerProducts.skusGenSizes')}
            </label>
            <input
              id={`sku-bulk-sizes-${productId}`}
              className="owner-sku-gen__input"
              value={bulkSizes}
              onChange={(e) => setBulkSizes(e.target.value)}
              placeholder={t('ownerProducts.skusGenSizesPh')}
            />
          </div>
        </div>
        <p className="owner-sku-gen__hint">{t('ownerProducts.skusGenHint')}</p>
        <button type="button" className="owner-sku-gen__btn" onClick={handleGenerateCombinations}>
          {t('ownerProducts.skusGenButton')}
        </button>
      </div>

      <div className="owner-sku-table-wrap">
        <table className="owner-sku-table">
          <thead>
            <tr>
              <th className="col-no">#</th>
              <th>{t('ownerProducts.skusColColor')}</th>
              <th>{t('ownerProducts.skusColSize')}</th>
              <th className="col-num">{t('ownerProducts.skusColStock')}</th>
              <th className="col-num">{t('ownerProducts.skusColPriceDelta')}</th>
              <th className="col-sale">{t('ownerProducts.skusColSalePrice')}</th>
              <th className="col-action">{t('ownerProducts.skusColAction')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const salePrice = basePrice + (row.price_delta ?? 0);
              const labelPreview =
                [row.color.trim(), row.size.trim()].filter(Boolean).join(' / ') ||
                t('ownerProducts.skusRowEmpty');
              return (
                <tr key={idx}>
                  <td className="col-no">{idx + 1}</td>
                  <td>
                    <input
                      className="owner-sku-cell-input"
                      aria-label={`${t('ownerProducts.skusColColor')} ${idx + 1}`}
                      placeholder={t('ownerProducts.skusColorExample')}
                      value={row.color}
                      onChange={(e) => updateRow(idx, { color: e.target.value })}
                      maxLength={40}
                    />
                  </td>
                  <td>
                    <input
                      className="owner-sku-cell-input"
                      aria-label={`${t('ownerProducts.skusColSize')} ${idx + 1}`}
                      placeholder={t('ownerProducts.skusSizeExample')}
                      value={row.size}
                      onChange={(e) => updateRow(idx, { size: e.target.value })}
                      maxLength={40}
                    />
                  </td>
                  <td className="col-num">
                    <input
                      className="owner-sku-cell-input owner-sku-cell-input--num"
                      aria-label={`${labelPreview} ${t('ownerProducts.skusColStock')}`}
                      placeholder="0"
                      value={row.stock_quantity ? formatIntegerDisplay(row.stock_quantity) : ''}
                      onChange={(e) => {
                        const n = parseIntegerInput(formatIntegerInputRaw(e.target.value));
                        updateRow(idx, { stock_quantity: Number.isFinite(n) ? n : 0 });
                      }}
                      inputMode="numeric"
                    />
                  </td>
                  <td className="col-num">
                    <div className="owner-sku-delta-wrap">
                      <span className="owner-sku-delta-prefix">±</span>
                      <input
                        className="owner-sku-cell-input owner-sku-cell-input--num"
                        aria-label={`${labelPreview} ${t('ownerProducts.skusColPriceDelta')}`}
                        placeholder="0"
                        value={formatSignedDeltaDisplay(row.price_delta)}
                        onChange={(e) => updateRow(idx, { price_delta: parseSignedDelta(e.target.value) })}
                        inputMode="numeric"
                      />
                    </div>
                  </td>
                  <td className="col-sale">{salePrice >= 0 ? `${salePrice.toLocaleString('ko-KR')}원` : '—'}</td>
                  <td className="col-action">
                    <button
                      type="button"
                      className="owner-sku-row-del"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(idx)}
                      aria-label={t('ownerProducts.skusRemoveRow')}
                    >
                      {t('ownerProducts.skusRemoveRow')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="owner-sku-footer">
        <div className="owner-sku-footer__left">
          <button type="button" className="owner-sku-btn" onClick={() => setRows((p) => [...p, emptyRow()])}>
            {t('ownerProducts.skusAddRow')}
          </button>
        </div>
        <button
          type="button"
          className="owner-sku-btn owner-sku-btn--primary"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? t('ownerProducts.submitting') : t('ownerProducts.skusSave')}
        </button>
      </div>

      {msg && <p className="owner-sku-msg-ok">{msg}</p>}
      {err && <p className="owner-sku-msg-err">{err}</p>}
    </section>
  );
}
