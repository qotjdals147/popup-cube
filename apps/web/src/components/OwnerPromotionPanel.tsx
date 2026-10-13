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
import { t } from '../i18n';
import '../styles/owner-product-edit.css';
import '../styles/owner-promo-gacha.css';

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

function activeWeightSum(entries: GachaEntryRow[]): number {
  return entries.filter((e) => e.is_active).reduce((s, e) => s + Math.max(1, e.weight), 0);
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
  const weightSum = useMemo(() => activeWeightSum(entries), [entries]);

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

  function entryLabel(entry: GachaEntryRow): string {
    return (
      entry.exclusive_name ??
      activeProducts.find((p) => p.id === entry.product_id)?.name ??
      entry.product_id ??
      ''
    );
  }

  function entryPct(entry: GachaEntryRow): string {
    if (!entry.is_active || weightSum <= 0) return '—';
    const pct = Math.round((Math.max(1, entry.weight) / weightSum) * 1000) / 10;
    return `${pct}%`;
  }

  if (loading) {
    return (
      <div className="owner-promo-page">
        <p className="owner-promo-page__intro">{t('ownerPromo.loading')}</p>
      </div>
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
    <div className="owner-promo-page">
      <p className="owner-promo-page__intro">{t('ownerPromo.intro')}</p>

      <article className="owner-promo-card">
        <h2 className="owner-promo-card__title">{t('ownerPromo.storeDefaultTitle')}</h2>
        <label className="owner-promo-toggle">
          <input type="checkbox" checked={promoActive} onChange={(e) => setPromoActive(e.target.checked)} />
          {t('ownerPromo.storeActive')}
        </label>
        {promoActive && (
          <>
            <p className="owner-promo-field__label">{t('ownerPromo.defaultModeLabel')}</p>
            <div className="owner-promo-mode-grid">
              {MODE_OPTIONS.map((opt) => (
                <label key={opt.value} className="owner-promo-mode-option">
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
              <div className="owner-promo-field">
                <label className="owner-promo-field__label">{t('ownerPromo.defaultDiscountLabel')}</label>
                <input
                  className="owner-promo-input-short"
                  type="number"
                  min={1}
                  max={100}
                  value={defaultDiscount}
                  onChange={(e) => setDefaultDiscount(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            )}
          </>
        )}
        <div className="owner-section-actions">
          <button
            type="button"
            className="owner-btn-primary"
            disabled={savingStore}
            onClick={() => void handleSaveStoreDefault()}
          >
            {savingStore ? t('ownerPromo.saving') : t('ownerPromo.saveDefault')}
          </button>
        </div>
      </article>

      <article className="owner-promo-card">
        <h2 className="owner-promo-card__title">{t('ownerPromo.productsTitle')}</h2>
        <p className="owner-promo-card__lead">{t('ownerPromo.productsHelp')}</p>
        {products.length === 0 ? (
          <p className="owner-promo-page__intro">{t('ownerPromo.noProducts')}</p>
        ) : (
          <div className="owner-promo-table-wrap">
            <table className="owner-promo-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }} aria-label="select" />
                  <th>{t('ownerPromo.colProduct')}</th>
                  <th>{t('ownerPromo.colMode')}</th>
                  <th>{t('ownerPromo.colDiscount')}</th>
                  <th>{t('ownerPromo.colEffective')}</th>
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
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                        />
                      </td>
                      <td>
                        {product.name}
                        {!product.is_active && (
                          <span className="owner-promo-table__muted"> ({t('ownerPromo.hidden')})</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="owner-promo-select"
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
                      <td>
                        {product.promo_mode === 'discount_only' || product.promo_mode === 'choice' ? (
                          <input
                            className="owner-promo-input-short"
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
                          <span className="owner-promo-table__muted">—</span>
                        )}
                      </td>
                      <td className="owner-promo-table__muted">
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
          <div className="owner-promo-bulk">
            <span className="owner-promo-bulk__count">
              {t('ownerPromo.bulkSelected', { count: selectedIds.size })}
            </span>
            <select
              className="owner-promo-select"
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
                className="owner-promo-input-short"
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
              className="owner-btn-primary"
              disabled={applyingBulk}
              onClick={() => void handleBulkApply()}
            >
              {applyingBulk ? t('ownerPromo.saving') : t('ownerPromo.bulkApply')}
            </button>
          </div>
        )}
      </article>

      <article className="owner-promo-card">
        <h2 className="owner-promo-card__title">{t('ownerPromo.gachaTitle')}</h2>
        <p className="owner-promo-card__lead owner-promo-card__lead--tight-bottom">{t('ownerPromo.gachaHelp')}</p>
        <label className="owner-promo-toggle">
          <input
            type="checkbox"
            checked={poolActive}
            disabled={savingPool}
            onChange={(e) => void handlePoolToggle(e.target.checked)}
          />
          {t('ownerPromo.gachaActive')}
        </label>

        {poolActive && (
          <div className="owner-gacha-add-section">
            <h3 className="owner-gacha-add-section__title">{t('ownerPromo.gachaAddSectionTitle')}</h3>
            <div className="owner-gacha-add-block">
              <p className="owner-gacha-add-block__title">{t('ownerPromo.gachaAddExclusiveTitle')}</p>
              <p className="owner-gacha-add-block__lead">{t('ownerPromo.gachaAddExclusiveLead')}</p>
              <div className="owner-gacha-add-row">
                <input
                  className="owner-promo-input-flex"
                  placeholder={t('ownerPromo.exclusiveNamePlaceholder')}
                  value={newEntryName}
                  onChange={(e) => setNewEntryName(e.target.value)}
                />
                <div className="owner-gacha-entry__weight">
                  <span className="owner-gacha-entry__weight-label">{t('ownerPromo.gachaWeightLabel')}</span>
                  <input
                    className="owner-promo-input-short"
                    type="number"
                    min={1}
                    value={newEntryWeight}
                    onChange={(e) => setNewEntryWeight(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="owner-btn-primary"
                  disabled={savingPool}
                  onClick={() => void handleAddExclusive()}
                >
                  {t('ownerPromo.addExclusive')}
                </button>
              </div>
            </div>

            {activeProducts.length > 0 && (
              <div className="owner-gacha-add-block">
                <p className="owner-gacha-add-block__title">{t('ownerPromo.gachaAddProductTitle')}</p>
                <p className="owner-gacha-add-block__lead">{t('ownerPromo.gachaAddProductLead')}</p>
                <div className="owner-gacha-add-row">
                  <select
                    className="owner-promo-select"
                    style={{ flex: 1, minWidth: 160 }}
                    value={addProductId}
                    onChange={(e) => setAddProductId(e.target.value)}
                  >
                    <option value="">{t('ownerPromo.pickProduct')}</option>
                    {activeProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="owner-gacha-entry__weight">
                    <span className="owner-gacha-entry__weight-label">{t('ownerPromo.gachaWeightLabel')}</span>
                    <input
                      className="owner-promo-input-short"
                      type="number"
                      min={1}
                      value={addProductWeight}
                      onChange={(e) => setAddProductWeight(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="owner-btn-primary"
                    disabled={savingPool || !addProductId}
                    onClick={() => void handleAddProductEntry()}
                  >
                    {t('ownerPromo.addProductPrize')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {poolActive && entries.length > 0 && (
          <>
            <h3 className="owner-gacha-list-section__title">{t('ownerPromo.gachaListSectionTitle')}</h3>
            <p className="owner-gacha-stats">
              {t('ownerPromo.gachaWeightSummary', { sum: String(weightSum) })}
            </p>
            <ul className="owner-gacha-list">
              {entries.map((entry) => (
                <li key={entry.id} className="owner-gacha-entry">
                  <span className="owner-gacha-entry__name">{entryLabel(entry)}</span>
                  <div className="owner-gacha-entry__weight">
                    <span className="owner-gacha-entry__weight-label">{t('ownerPromo.gachaWeightLabel')}</span>
                    <input
                      className="owner-promo-input-short"
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
                  </div>
                  <span className="owner-gacha-entry__pct">{entryPct(entry)}</span>
                  <label className="owner-gacha-entry__active">
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
                    {t('ownerPromo.gachaEntryActive')}
                  </label>
                  <button
                    type="button"
                    className="owner-btn-ghost"
                    style={{ color: '#c92a2a', borderColor: '#ffc9c9' }}
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
          </>
        )}

        {poolActive && entries.length === 0 && (
          <p className="owner-promo-card__lead">{t('ownerPromo.gachaEmptyHint')}</p>
        )}
      </article>

      {error && <p className="owner-promo-alert owner-promo-alert--error">{error}</p>}
      {savedMsg && <p className="owner-promo-alert owner-promo-alert--ok">{savedMsg}</p>}
    </div>
  );
}
