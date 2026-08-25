import { useEffect, useMemo, useState } from 'react';
import type { ProductPromoMode, StoreDefaultPromoMode } from '@popup-cube/shared';
import { resolveEffectivePromo } from '@popup-cube/shared';
import {
  addExclusiveGachaEntry,
  addProductGachaEntry,
  bulkUpdateProductPromos,
  deleteGachaEntry,
  getOrCreateStoreGachaPool,
  getStorePromotion,
  listGachaEntries,
  listProductPromos,
  setGachaPoolActive,
  updateGachaEntry,
  updateProductPromo,
  upsertStorePromotion,
  type GachaEntryRow,
  type ProductPromoRow,
} from '../lib/promotions';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

interface OwnerPromotionPanelProps {
  storeId: string;
}

type BulkPreset = ProductPromoMode | 'inherit';

const MODE_OPTIONS: { value: StoreDefaultPromoMode; labelKey: string }[] = [
  { value: 'none', labelKey: 'ownerPromo.modeNone' },
  { value: 'discount_only', labelKey: 'ownerPromo.modeDiscountOnly' },
  { value: 'gacha_only', labelKey: 'ownerPromo.modeGachaOnly' },
  { value: 'choice', labelKey: 'ownerPromo.modeChoice' },
];

const PRODUCT_MODE_OPTIONS: { value: BulkPreset; labelKey: string }[] = [
  { value: 'inherit', labelKey: 'ownerPromo.productInherit' },
  { value: 'none', labelKey: 'ownerPromo.modeNone' },
  { value: 'discount_only', labelKey: 'ownerPromo.modeDiscountOnly' },
  { value: 'gacha_only', labelKey: 'ownerPromo.modeGachaOnly' },
  { value: 'choice', labelKey: 'ownerPromo.modeChoice' },
];

function effectiveModeLabel(mode: string, discount: number): string {
  const base =
    mode === 'none'
      ? t('ownerPromo.modeNone')
      : mode === 'discount_only'
        ? t('ownerPromo.modeDiscountOnly')
        : mode === 'gacha_only'
          ? t('ownerPromo.modeGachaOnly')
          : t('ownerPromo.modeChoice');
  return discount > 0 ? `${base} · ${discount}%` : base;
}

export function OwnerPromotionPanel({ storeId }: OwnerPromotionPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);

  const [promoActive, setPromoActive] = useState(false);
  const [defaultMode, setDefaultMode] = useState<StoreDefaultPromoMode>('choice');
  const [defaultDiscount, setDefaultDiscount] = useState(10);

  const [products, setProducts] = useState<ProductPromoRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkMode, setBulkMode] = useState<BulkPreset>('inherit');
  const [bulkDiscount, setBulkDiscount] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  const [poolId, setPoolId] = useState<string | null>(null);
  const [poolActive, setPoolActive] = useState(false);
  const [entries, setEntries] = useState<GachaEntryRow[]>([]);
  const [savingPool, setSavingPool] = useState(false);
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntryWeight, setNewEntryWeight] = useState('10');
  const [addProductId, setAddProductId] = useState('');
  const [addProductWeight, setAddProductWeight] = useState('10');

  const activeProducts = useMemo(() => products.filter((p) => p.is_active), [products]);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [promo, productRows, pool] = await Promise.all([
        getStorePromotion(storeId),
        listProductPromos(storeId),
        getOrCreateStoreGachaPool(storeId),
      ]);
      setPromoActive(promo?.is_active ?? false);
      setDefaultMode(promo?.default_promo_mode ?? 'choice');
      setDefaultDiscount(promo?.discount_percent ?? 10);
      setProducts(productRows);
      setPoolId(pool.id);
      setPoolActive(pool.is_active);
      const entryRows = await listGachaEntries(pool.id);
      setEntries(entryRows);
    } catch {
      setError(t('ownerPromo.errorLoad'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [storeId]);

  async function handleSaveStoreDefault() {
    setSavingStore(true);
    setError(null);
    setSavedMsg(null);
    try {
      await upsertStorePromotion(storeId, {
        is_active: promoActive,
        discount_percent: defaultDiscount,
        default_promo_mode: defaultMode,
      });
      setSavedMsg(t('ownerPromo.saved'));
    } catch {
      setError(t('ownerPromo.errorSave'));
    } finally {
      setSavingStore(false);
    }
  }

  async function handleProductModeChange(productId: string, mode: ProductPromoMode, discount: number | null) {
    setError(null);
    try {
      await updateProductPromo(productId, mode, discount);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, promo_mode: mode, promo_discount_percent: discount } : p,
        ),
      );
    } catch {
      setError(t('ownerPromo.errorSave'));
    }
  }

  async function handleBulkApply() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setApplyingBulk(true);
    setError(null);
    try {
      const discount =
        bulkMode === 'discount_only' || bulkMode === 'choice'
          ? parseInt(bulkDiscount, 10) || null
          : null;
      await bulkUpdateProductPromos(ids, bulkMode, discount);
      await reload();
      setSelectedIds(new Set());
      setSavedMsg(t('ownerPromo.bulkApplied'));
    } catch {
      setError(t('ownerPromo.errorSave'));
    } finally {
      setApplyingBulk(false);
    }
  }

  async function handlePoolToggle(next: boolean) {
    if (!poolId) return;
    setSavingPool(true);
    setError(null);
    try {
      await setGachaPoolActive(poolId, next);
      setPoolActive(next);
    } catch {
      setError(t('ownerPromo.errorSave'));
    } finally {
      setSavingPool(false);
    }
  }

  async function handleAddExclusive() {
    if (!poolId || !newEntryName.trim()) return;
    setSavingPool(true);
    setError(null);
    try {
      await addExclusiveGachaEntry(poolId, {
        exclusive_name: newEntryName.trim(),
        weight: parseInt(newEntryWeight, 10) || 10,
      });
      setNewEntryName('');
      setEntries(await listGachaEntries(poolId));
    } catch {
      setError(t('ownerPromo.errorSave'));
    } finally {
      setSavingPool(false);
    }
  }

  async function handleAddProductEntry() {
    if (!poolId || !addProductId) return;
    setSavingPool(true);
    setError(null);
    try {
      await addProductGachaEntry(poolId, addProductId, parseInt(addProductWeight, 10) || 10);
      setAddProductId('');
      setEntries(await listGachaEntries(poolId));
    } catch {
      setError(t('ownerPromo.errorSave'));
    } finally {
      setSavingPool(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <section style={styles.panel}>
        <p style={styles.hint}>{t('ownerPromo.loading')}</p>
      </section>
    );
  }

  const storePromoDraft = promoActive
    ? {
        store_id: storeId,
        is_active: true,
        discount_percent: defaultDiscount,
        default_promo_mode: defaultMode,
      }
    : null;

  return (
    <section style={styles.panel}>
      <p style={styles.intro}>{t('ownerPromo.intro')}</p>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('ownerPromo.storeDefaultTitle')}</h3>
        <label style={styles.checkRow}>
          <input type="checkbox" checked={promoActive} onChange={(e) => setPromoActive(e.target.checked)} />
          {t('ownerPromo.storeActive')}
        </label>
        {promoActive && (
          <>
            <p style={styles.label}>{t('ownerPromo.defaultModeLabel')}</p>
            <div style={styles.modeRow}>
              {MODE_OPTIONS.map((opt) => (
                <label key={opt.value} style={styles.modeOption}>
                  <input
                    type="radio"
                    name="defaultMode"
                    checked={defaultMode === opt.value}
                    onChange={() => setDefaultMode(opt.value)}
                  />
                  {t(opt.labelKey as 'ownerPromo.modeNone')}
                </label>
              ))}
            </div>
            {(defaultMode === 'discount_only' || defaultMode === 'choice') && (
              <>
                <label style={styles.label}>{t('ownerPromo.defaultDiscountLabel')}</label>
                <input
                  style={styles.inputShort}
                  type="number"
                  min={1}
                  max={100}
                  value={defaultDiscount}
                  onChange={(e) => setDefaultDiscount(parseInt(e.target.value, 10) || 0)}
                />
              </>
            )}
          </>
        )}
        <button
          type="button"
          style={styles.saveBtn}
          disabled={savingStore}
          onClick={() => void handleSaveStoreDefault()}
        >
          {savingStore ? t('ownerPromo.saving') : t('ownerPromo.saveDefault')}
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('ownerPromo.productsTitle')}</h3>
        <p style={styles.help}>{t('ownerPromo.productsHelp')}</p>
        {products.length === 0 ? (
          <p style={styles.hint}>{t('ownerPromo.noProducts')}</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thCheck} />
                  <th style={styles.th}>{t('ownerPromo.colProduct')}</th>
                  <th style={styles.th}>{t('ownerPromo.colMode')}</th>
                  <th style={styles.th}>{t('ownerPromo.colDiscount')}</th>
                  <th style={styles.th}>{t('ownerPromo.colEffective')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const effective = resolveEffectivePromo(
                    {
                      promo_mode: product.promo_mode,
                      promo_discount_percent: product.promo_discount_percent,
                    },
                    storePromoDraft,
                  );
                  return (
                    <tr key={product.id}>
                      <td style={styles.td}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                        />
                      </td>
                      <td style={styles.td}>
                        {product.name}
                        {!product.is_active && ` (${t('ownerPromo.hidden')})`}
                      </td>
                      <td style={styles.td}>
                        <select
                          style={styles.select}
                          value={product.promo_mode}
                          onChange={(e) => {
                            const mode = e.target.value as ProductPromoMode;
                            const disc =
                              mode === 'discount_only' || mode === 'choice'
                                ? product.promo_discount_percent ?? defaultDiscount
                                : null;
                            void handleProductModeChange(product.id, mode, disc);
                          }}
                        >
                          {PRODUCT_MODE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.labelKey as 'ownerPromo.productInherit')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.td}>
                        {product.promo_mode === 'discount_only' || product.promo_mode === 'choice' ? (
                          <input
                            style={styles.inputShort}
                            type="number"
                            min={1}
                            max={100}
                            value={product.promo_discount_percent ?? ''}
                            placeholder={String(defaultDiscount)}
                            onChange={(e) => {
                              const v = e.target.value ? parseInt(e.target.value, 10) : null;
                              void handleProductModeChange(product.id, product.promo_mode, v);
                            }}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={styles.tdMuted}>
                        {effectiveModeLabel(effective.mode, effective.discountPercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedIds.size > 0 && (
          <div style={styles.bulkBar}>
            <span>{t('ownerPromo.bulkSelected', { count: selectedIds.size })}</span>
            <select
              style={styles.select}
              value={bulkMode}
              onChange={(e) => setBulkMode(e.target.value as BulkPreset)}
            >
              {PRODUCT_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey as 'ownerPromo.productInherit')}
                </option>
              ))}
            </select>
            {(bulkMode === 'discount_only' || bulkMode === 'choice') && (
              <input
                style={styles.inputShort}
                type="number"
                min={1}
                max={100}
                placeholder={String(defaultDiscount)}
                value={bulkDiscount}
                onChange={(e) => setBulkDiscount(e.target.value)}
              />
            )}
            <button
              type="button"
              style={styles.secondaryBtn}
              disabled={applyingBulk}
              onClick={() => void handleBulkApply()}
            >
              {applyingBulk ? t('ownerPromo.saving') : t('ownerPromo.bulkApply')}
            </button>
          </div>
        )}
      </div>

      <div style={styles.sectionLast}>
        <h3 style={styles.sectionTitle}>{t('ownerPromo.gachaTitle')}</h3>
        <label style={styles.checkRow}>
          <input
            type="checkbox"
            checked={poolActive}
            disabled={savingPool}
            onChange={(e) => void handlePoolToggle(e.target.checked)}
          />
          {t('ownerPromo.gachaActive')}
        </label>
        <p style={styles.help}>{t('ownerPromo.gachaHelp')}</p>

        {entries.length > 0 && (
          <ul style={styles.entryList}>
            {entries.map((entry) => (
              <li key={entry.id} style={styles.entryItem}>
                <span>
                  {entry.exclusive_name ??
                    activeProducts.find((p) => p.id === entry.product_id)?.name ??
                    entry.product_id}
                </span>
                <input
                  style={styles.inputShort}
                  type="number"
                  min={1}
                  value={entry.weight}
                  onChange={(e) => {
                    const w = parseInt(e.target.value, 10) || 1;
                    void updateGachaEntry(entry.id, { weight: w }).then(() =>
                      setEntries((prev) =>
                        prev.map((en) => (en.id === entry.id ? { ...en, weight: w } : en)),
                      ),
                    );
                  }}
                />
                <label style={styles.inlineCheck}>
                  <input
                    type="checkbox"
                    checked={entry.is_active}
                    onChange={(e) => {
                      void updateGachaEntry(entry.id, { is_active: e.target.checked }).then(() =>
                        setEntries((prev) =>
                          prev.map((en) =>
                            en.id === entry.id ? { ...en, is_active: e.target.checked } : en,
                          ),
                        ),
                      );
                    }}
                  />
                  ON
                </label>
                <button
                  type="button"
                  style={styles.linkBtn}
                  onClick={() =>
                    void deleteGachaEntry(entry.id).then(() =>
                      setEntries((prev) => prev.filter((en) => en.id !== entry.id)),
                    )
                  }
                >
                  {t('ownerPromo.deleteEntry')}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div style={styles.addRow}>
          <input
            style={styles.input}
            placeholder={t('ownerPromo.exclusiveNamePlaceholder')}
            value={newEntryName}
            onChange={(e) => setNewEntryName(e.target.value)}
          />
          <input
            style={styles.inputShort}
            type="number"
            min={1}
            value={newEntryWeight}
            onChange={(e) => setNewEntryWeight(e.target.value)}
          />
          <button type="button" style={styles.secondaryBtn} disabled={savingPool} onClick={() => void handleAddExclusive()}>
            {t('ownerPromo.addExclusive')}
          </button>
        </div>

        {activeProducts.length > 0 && (
          <div style={styles.addRow}>
            <select style={styles.select} value={addProductId} onChange={(e) => setAddProductId(e.target.value)}>
              <option value="">{t('ownerPromo.pickProduct')}</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              style={styles.inputShort}
              type="number"
              min={1}
              value={addProductWeight}
              onChange={(e) => setAddProductWeight(e.target.value)}
            />
            <button type="button" style={styles.secondaryBtn} disabled={savingPool || !addProductId} onClick={() => void handleAddProductEntry()}>
              {t('ownerPromo.addProductPrize')}
            </button>
          </div>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {savedMsg && <p style={styles.success}>{savedMsg}</p>}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: oc.surface,
    borderRadius: 12,
    padding: 24,
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadow,
  },
  intro: { color: oc.textSecondary, fontSize: fs.base, lineHeight: 1.55, margin: '0 0 20px' },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: `1px solid ${oc.border}`,
  },
  sectionLast: { marginBottom: 8 },
  sectionTitle: { margin: '0 0 12px', fontSize: fs.lg, color: oc.text, fontWeight: 700 },
  label: { display: 'block', color: oc.textMuted, fontSize: fs.sm, margin: '10px 0 6px' },
  hint: { color: oc.textMuted, fontSize: fs.sm },
  help: { color: oc.textMuted, fontSize: fs.sm, lineHeight: 1.45, margin: '0 0 12px' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' },
  modeRow: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  modeOption: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.base,
    boxSizing: 'border-box',
  },
  inputShort: {
    width: 72,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.base,
  },
  select: {
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
    maxWidth: 160,
  },
  saveBtn: {
    marginTop: 8,
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.base,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    fontSize: fs.sm,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: fs.sm },
  th: { textAlign: 'left', padding: '8px 6px', borderBottom: `1px solid ${oc.border}`, color: oc.textMuted },
  thCheck: { width: 32, borderBottom: `1px solid ${oc.border}` },
  td: { padding: '10px 6px', borderBottom: `1px solid ${oc.border}`, verticalAlign: 'middle' },
  tdMuted: { padding: '10px 6px', borderBottom: `1px solid ${oc.border}`, color: oc.textMuted, fontSize: fs.sm },
  bulkBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 12,
    background: oc.surfaceMuted,
    borderRadius: 8,
  },
  entryList: { listStyle: 'none', margin: '0 0 16px', padding: 0 },
  entryItem: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: `1px solid ${oc.border}`,
  },
  inlineCheck: { display: 'flex', alignItems: 'center', gap: 4, fontSize: fs.sm },
  linkBtn: {
    border: 'none',
    background: 'none',
    color: oc.danger,
    cursor: 'pointer',
    fontSize: fs.sm,
  },
  addRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' },
  error: { color: oc.danger, marginTop: 12 },
  success: { color: oc.success, marginTop: 12 },
};
