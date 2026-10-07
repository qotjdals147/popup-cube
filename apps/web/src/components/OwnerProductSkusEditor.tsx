import { useEffect, useMemo, useState } from 'react';
import { MAX_PRODUCT_OPTION_GROUPS } from '@popup-cube/shared';
import {
  DEFAULT_OPTION_GROUP_NAMES,
  deriveOptionGroupNames,
  getOwnerProductSkus,
  saveOwnerProductSkus,
  type OwnerSkuRow,
} from '../lib/productSkus';
import { formatIntegerDisplay, formatIntegerInputRaw, parseIntegerInput } from '../lib/formatInteger';
import { t } from '../i18n';
import '../styles/owner-product-skus.css';

interface OwnerProductSkusEditorProps {
  productId: string;
  basePrice: number;
}

/** 조합 수가 이보다 많아지면 점주에게 경고 (실수로 수백 행 만드는 것 방지) */
const COMBINATION_WARN_THRESHOLD = 60;

function emptyRow(groupCount: number): OwnerSkuRow {
  return {
    values: Array.from({ length: groupCount }, () => ''),
    adjustments: Array.from({ length: groupCount }, () => 0),
    stock_quantity: 0,
    price_delta: 0,
  };
}

function rowEffectiveDelta(row: OwnerSkuRow): number {
  const sum = (row.adjustments ?? []).reduce((s, a) => s + (a ?? 0), 0);
  return sum !== 0 ? sum : row.price_delta ?? 0;
}

function rowKey(values: string[]): string {
  return values.map((v) => v.trim().toLowerCase()).join('\u0000');
}

function rowIsEmpty(row: OwnerSkuRow): boolean {
  return row.values.every((v) => !v.trim());
}

function parseSignedDelta(raw: string): number {
  const cleaned = raw
    .replace(/\s/g, '')
    .replace(/,/g, '')
    .replace(/\u2212/g, '-')
    .replace(/\uFF0D/g, '-');
  if (!cleaned || cleaned === '-' || cleaned === '+') return 0;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

function formatSignedDeltaDisplay(value: number): string {
  if (!value) return '';
  return value.toLocaleString('ko-KR');
}

/** 입력 중 `-`만 있어도 칸이 비지 않게 — 숫자·쉼표·앞쪽 ±만 허용 */
function sanitizeSignedDeltaInput(raw: string): string {
  let s = raw.replace(/\u2212/g, '-').replace(/\uFF0D/g, '-');
  s = s.replace(/[^\d,\-+]/g, '');
  const m = s.match(/^([+-]?)([\d,]*)/);
  if (!m) return '';
  return `${m[1] ?? ''}${m[2] ?? ''}`;
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

/** AD-090 — 2중 곱집합 → N중 곱집합. 값이 비어 있는 옵션은 건너뛴다. */
function buildCombinations(lists: string[][]): string[][] {
  let acc: string[][] = [[]];
  lists.forEach((list, i) => {
    const values = list.length > 0 ? list : [''];
    const next: string[][] = [];
    for (const row of acc) {
      for (const v of values) {
        const copy = [...row];
        copy[i] = v;
        next.push(copy);
      }
    }
    acc = next;
  });
  return acc.filter((values) => values.some((v) => v.trim()));
}

function mergeGeneratedRows(existing: OwnerSkuRow[], generated: string[][]): OwnerSkuRow[] {
  const byKey = new Map<string, OwnerSkuRow>();
  for (const r of existing) {
    if (rowIsEmpty(r)) continue;
    byKey.set(rowKey(r.values), r);
  }
  for (const values of generated) {
    const k = rowKey(values);
    if (!byKey.has(k)) {
      byKey.set(k, {
        values,
        adjustments: values.map(() => 0),
        stock_quantity: 0,
        price_delta: 0,
      });
    }
  }
  return [...byKey.values()];
}

function resizeRow(row: OwnerSkuRow, groupCount: number): OwnerSkuRow {
  const values = Array.from({ length: groupCount }, (_, i) => row.values[i] ?? '');
  const adjustments = Array.from({ length: groupCount }, (_, i) => row.adjustments?.[i] ?? 0);
  return { ...row, values, adjustments };
}

export function OwnerProductSkusEditor({ productId, basePrice }: OwnerProductSkusEditorProps) {
  const [groupNames, setGroupNames] = useState<string[]>(DEFAULT_OPTION_GROUP_NAMES);
  const [rows, setRows] = useState<OwnerSkuRow[]>([emptyRow(DEFAULT_OPTION_GROUP_NAMES.length)]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bulkValues, setBulkValues] = useState<string[]>(() =>
    DEFAULT_OPTION_GROUP_NAMES.map(() => '')
  );
  /** ± 칸 — `-` 입력 직후 parse=0 이면 value가 지워지는 버그 방지 (입력 중 문자열 유지) */
  const [deltaDraft, setDeltaDraft] = useState<Record<number, string>>({});
  const [cellAdjDraft, setCellAdjDraft] = useState<Record<string, string>>({});

  const activeRows = useMemo(() => rows.filter((r) => !rowIsEmpty(r)), [rows]);
  const totalOptionStock = useMemo(
    () => activeRows.reduce((sum, r) => sum + Math.max(0, r.stock_quantity), 0),
    [activeRows]
  );
  const pendingCombinationCount = useMemo(() => {
    const lists = groupNames.map((_, i) => parseOptionList(bulkValues[i] ?? ''));
    if (lists.every((l) => l.length === 0)) return 0;
    return lists.reduce((n, l) => n * Math.max(1, l.length), 1);
  }, [groupNames, bulkValues]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await getOwnerProductSkus(productId);
        if (cancelled) return;
        const activeSkus = data.filter((s) => s.is_active !== false);
        const source = activeSkus.length > 0 ? activeSkus : data;
        const names = deriveOptionGroupNames(source);
        const nextNames = names.length > 0 ? names : DEFAULT_OPTION_GROUP_NAMES;
        setGroupNames(nextNames);
        setBulkValues(nextNames.map(() => ''));
        setRows(
          source.length === 0
            ? [emptyRow(nextNames.length)]
            : source.map((s) => ({
                values: nextNames.map((_, i) => s.option_values[i]?.value ?? ''),
                adjustments: nextNames.map((_, i) => s.option_values[i]?.adjustment ?? 0),
                stock_quantity: s.stock_quantity,
                price_delta: s.price_delta ?? 0,
              }))
        );
        setDeltaDraft({});
        setCellAdjDraft({});
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
    const negativeSale = activeRows.find((r) => basePrice + rowEffectiveDelta(r) < 0);
    if (negativeSale) {
      setSaving(false);
      setErr(t('ownerProducts.skusSaveErrorNegativeSale'));
      return;
    }
    try {
      await saveOwnerProductSkus(productId, groupNames, rows);
      setDeltaDraft({});
      setMsg(t('ownerProducts.skusSaved'));
    } catch (e) {
      const raw = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '';
      if (raw.includes('not_store_owner')) {
        setErr(t('ownerProducts.skusSaveErrorOwner'));
      } else if (raw.includes('too_many_option_groups')) {
        setErr(t('ownerProducts.skusSaveErrorTooManyGroups'));
      } else {
        setErr(t('ownerProducts.skusSaveError'));
      }
    } finally {
      setSaving(false);
    }
  }

  function addGroup() {
    if (groupNames.length >= MAX_PRODUCT_OPTION_GROUPS) return;
    const next = [...groupNames, ''];
    setGroupNames(next);
    setBulkValues((prev) => [...prev, '']);
    setRows((prev) => prev.map((r) => resizeRow(r, next.length)));
  }

  function removeGroup(idx: number) {
    if (groupNames.length <= 1) return;
    setGroupNames((prev) => prev.filter((_, i) => i !== idx));
    setBulkValues((prev) => prev.filter((_, i) => i !== idx));
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        values: r.values.filter((_, i) => i !== idx),
        adjustments: (r.adjustments ?? []).filter((_, i) => i !== idx),
      }))
    );
  }

  function handleGenerateCombinations() {
    const lists = groupNames.map((_, i) => parseOptionList(bulkValues[i] ?? ''));
    const generated = buildCombinations(lists);
    if (generated.length === 0) {
      setErr(t('ownerProducts.skusGenEmpty'));
      return;
    }
    setErr(null);
    setRows((prev) => {
      const merged = mergeGeneratedRows(prev, generated);
      return merged.length > 0 ? merged : [emptyRow(groupNames.length)];
    });
    setMsg(t('ownerProducts.skusGenDone', { count: generated.length }));
  }

  function updateRow(idx: number, patch: Partial<OwnerSkuRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function updateRowValue(idx: number, groupIdx: number, value: string) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const values = [...r.values];
        values[groupIdx] = value;
        return { ...r, values };
      })
    );
  }

  function updateRowCellAdjustment(idx: number, groupIdx: number, raw: string) {
    const key = `${idx}-${groupIdx}`;
    setCellAdjDraft((prev) => ({ ...prev, [key]: raw }));
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const adjustments = [...(r.adjustments ?? r.values.map(() => 0))];
        adjustments[groupIdx] = parseSignedDelta(raw);
        return { ...r, adjustments };
      })
    );
  }

  function removeRow(idx: number) {
    setDeltaDraft({});
    setCellAdjDraft({});
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : [emptyRow(groupNames.length)];
    });
  }

  function deltaInputValue(idx: number, row: OwnerSkuRow): string {
    if (Object.prototype.hasOwnProperty.call(deltaDraft, idx)) {
      return deltaDraft[idx]!;
    }
    const sum = (row.adjustments ?? []).reduce((s, a) => s + (a ?? 0), 0);
    if (sum !== 0) return formatSignedDeltaDisplay(sum);
    return formatSignedDeltaDisplay(row.price_delta);
  }

  function cellAdjInputValue(idx: number, groupIdx: number, row: OwnerSkuRow): string {
    const key = `${idx}-${groupIdx}`;
    if (Object.prototype.hasOwnProperty.call(cellAdjDraft, key)) {
      return cellAdjDraft[key]!;
    }
    return formatSignedDeltaDisplay(row.adjustments?.[groupIdx] ?? 0);
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
        <p>{t('ownerProducts.skusTipGroups')}</p>
        <p>{t('ownerProducts.skusTipStock')}</p>
        <p>{t('ownerProducts.skusTipPrice')}</p>
        <p>{t('ownerProducts.skusTipCellAdj')}</p>
      </div>

      <div className="owner-sku-gen">
        <p className="owner-sku-gen__title">{t('ownerProducts.skusGenTitle')}</p>
        <div className="owner-sku-gen__fields">
          {groupNames.map((name, i) => (
            <div key={i}>
              <label className="owner-sku-gen__label" htmlFor={`sku-bulk-${productId}-${i}`}>
                {name.trim() || t('ownerProducts.skusGroupFallback', { index: i + 1 })}
              </label>
              <input
                id={`sku-bulk-${productId}-${i}`}
                className="owner-sku-gen__input"
                value={bulkValues[i] ?? ''}
                onChange={(e) =>
                  setBulkValues((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                }
                placeholder={t('ownerProducts.skusGenValuesPh')}
              />
            </div>
          ))}
        </div>
        <p className="owner-sku-gen__hint">{t('ownerProducts.skusGenHint')}</p>
        {pendingCombinationCount > COMBINATION_WARN_THRESHOLD && (
          <p className="owner-sku-gen__warn">
            {t('ownerProducts.skusGenTooMany', { count: pendingCombinationCount })}
          </p>
        )}
        <button type="button" className="owner-sku-gen__btn" onClick={handleGenerateCombinations}>
          {t('ownerProducts.skusGenButton')}
        </button>
      </div>

      <div className="owner-sku-table-wrap">
        <table className="owner-sku-table">
          <thead>
            <tr>
              <th className="col-no">#</th>
              {groupNames.map((name, i) => (
                <th key={i} className="col-group">
                  <div className="owner-sku-group-head">
                    <input
                      className="owner-sku-group-name"
                      aria-label={t('ownerProducts.skusGroupNameLabel', { index: i + 1 })}
                      placeholder={t('ownerProducts.skusGroupNamePh')}
                      value={name}
                      onChange={(e) =>
                        setGroupNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))
                      }
                      maxLength={40}
                    />
                    <button
                      type="button"
                      className="owner-sku-group-del"
                      disabled={groupNames.length <= 1}
                      onClick={() => removeGroup(i)}
                      aria-label={t('ownerProducts.skusRemoveGroup')}
                      title={t('ownerProducts.skusRemoveGroup')}
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
              <th className="col-num">{t('ownerProducts.skusColStock')}</th>
              <th className="col-num">{t('ownerProducts.skusColPriceDelta')}</th>
              <th className="col-sale">{t('ownerProducts.skusColSalePrice')}</th>
              <th className="col-action">{t('ownerProducts.skusColAction')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const salePrice = basePrice + rowEffectiveDelta(row);
              const labelPreview =
                row.values.map((v) => v.trim()).filter(Boolean).join(' / ') ||
                t('ownerProducts.skusRowEmpty');
              return (
                <tr key={idx}>
                  <td className="col-no">{idx + 1}</td>
                  {groupNames.map((name, gi) => (
                    <td key={gi}>
                      <div className="owner-sku-cell-stack">
                        <input
                          className="owner-sku-cell-input"
                          aria-label={`${name.trim() || t('ownerProducts.skusGroupFallback', { index: gi + 1 })} ${idx + 1}`}
                          placeholder={t('ownerProducts.skusValuePh')}
                          value={row.values[gi] ?? ''}
                          onChange={(e) => updateRowValue(idx, gi, e.target.value)}
                          maxLength={40}
                        />
                        <input
                          className="owner-sku-cell-input owner-sku-cell-adj"
                          aria-label={`${name.trim() || t('ownerProducts.skusGroupFallback', { index: gi + 1 })} ${t('ownerProducts.skusCellAdjLabel')}`}
                          placeholder={t('ownerProducts.skusCellAdjPh')}
                          value={cellAdjInputValue(idx, gi, row)}
                          onChange={(e) =>
                            updateRowCellAdjustment(idx, gi, sanitizeSignedDeltaInput(e.target.value))
                          }
                          onBlur={() => {
                            const key = `${idx}-${gi}`;
                            setCellAdjDraft((prev) => {
                              if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev;
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                          }}
                          inputMode="text"
                        />
                      </div>
                    </td>
                  ))}
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
                        placeholder={t('ownerProducts.skusPriceDeltaPh')}
                        value={deltaInputValue(idx, row)}
                        onChange={(e) => {
                          const raw = sanitizeSignedDeltaInput(e.target.value);
                          setDeltaDraft((prev) => ({ ...prev, [idx]: raw }));
                          updateRow(idx, { price_delta: parseSignedDelta(raw) });
                        }}
                        onBlur={() => {
                          setDeltaDraft((prev) => {
                            if (!Object.prototype.hasOwnProperty.call(prev, idx)) return prev;
                            const next = { ...prev };
                            delete next[idx];
                            return next;
                          });
                        }}
                        inputMode="text"
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
          <button
            type="button"
            className="owner-sku-btn"
            onClick={() => setRows((p) => [...p, emptyRow(groupNames.length)])}
          >
            {t('ownerProducts.skusAddRow')}
          </button>
          <button
            type="button"
            className="owner-sku-btn"
            disabled={groupNames.length >= MAX_PRODUCT_OPTION_GROUPS}
            onClick={addGroup}
            title={
              groupNames.length >= MAX_PRODUCT_OPTION_GROUPS
                ? t('ownerProducts.skusGroupMax', { max: MAX_PRODUCT_OPTION_GROUPS })
                : undefined
            }
          >
            {t('ownerProducts.skusAddGroup')}
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

      {groupNames.length >= MAX_PRODUCT_OPTION_GROUPS && (
        <p className="owner-sku-gen__hint">
          {t('ownerProducts.skusGroupMax', { max: MAX_PRODUCT_OPTION_GROUPS })}
        </p>
      )}
      {msg && <p className="owner-sku-msg-ok">{msg}</p>}
      {err && <p className="owner-sku-msg-err">{err}</p>}
    </section>
  );
}
