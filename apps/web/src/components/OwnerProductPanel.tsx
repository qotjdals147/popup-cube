import { useEffect, useRef, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import {
  createProduct,
  listMyProducts,
  ProductError,
  setProductActive,
  updateProduct,
  updateProductFulfillment,
} from '../lib/products';
import { t } from '../i18n';
import {
  formatIntegerDisplay,
  formatIntegerInputRaw,
  parseIntegerInput,
} from '../lib/formatInteger';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerProductPanelProps {
  storeId: string;
  userId: string;
  onClose?: () => void;
  /** 에디터 탭에 임베드 — 모달 오버레이 없음 (Sprint 2) */
  embedded?: boolean;
}

/**
 * 쉬운 설명: 점주가 자기 매장에 팔 상품을 등록하고, 등록해둔 상품 목록을 보는 창.
 * "숨기기"를 누르면 손님 화면에서만 안 보이고(soft delete), 완전히 지워지진 않음
 * (나중에 주문 이력과 연결될 걸 대비).
 */
export function OwnerProductPanel({ storeId, userId, onClose, embedded = false }: OwnerProductPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editAutoEnabled, setEditAutoEnabled] = useState(false);
  const [editAutoLimit, setEditAutoLimit] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);

  async function reload() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listMyProducts(storeId);
      setProducts(data);
    } catch {
      setLoadError(t('ownerProducts.errorLoad'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setEditImageFile(file);
    setEditPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : prev;
    });
  }

  function cancelEdit() {
    setEditPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setEditImageFile(null);
    setEditingId(null);
  }

  function blurFormatInteger(value: string, setter: (v: string) => void) {
    if (!value.trim()) return;
    setter(formatIntegerInputRaw(value));
  }

  useEffect(() => {
    if (!loading && products.length === 0) {
      setCreateFormOpen(true);
    }
  }, [loading, products.length]);

  function resetCreateForm() {
    setName('');
    setPrice('');
    setDescription('');
    setImageFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFormError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceNumber = parseIntegerInput(price);

    if (!name.trim() || !price.trim() || !Number.isFinite(priceNumber) || priceNumber < 0) {
      setFormError(t('ownerProducts.errorRequired'));
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createProduct(userId, {
        storeId,
        name,
        description,
        price: Math.round(priceNumber),
        imageFile,
      });
      setName('');
      setPrice('');
      setDescription('');
      setImageFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCreateFormOpen(false);
      await reload();
    } catch (err) {
      if (err instanceof ProductError && err.code === 'IMAGE_TOO_LARGE') {
        setFormError(t('ownerProducts.errorImageTooLarge'));
      } else {
        setFormError(t('ownerProducts.errorGeneric'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(product: Product) {
    try {
      await setProductActive(product.id, !product.is_active);
      await reload();
    } catch {
      setLoadError(t('ownerProducts.errorGeneric'));
    }
  }

  function startEdit(product: Product) {
    setCreateFormOpen(false);
    if (editingId) {
      setEditPreviewUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    }
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(formatIntegerDisplay(product.price));
    setEditDescription(product.description ?? '');
    setEditStock(formatIntegerDisplay(product.stock_quantity));
    setEditAutoEnabled(product.auto_accept_enabled);
    setEditAutoLimit(
      product.auto_accept_limit > 0 ? formatIntegerDisplay(product.auto_accept_limit) : ''
    );
    setEditImageFile(null);
    setEditPreviewUrl(product.image_url);
  }

  async function handleSaveEdit(productId: string) {
    const priceNumber = parseIntegerInput(editPrice);
    const stockNumber = parseIntegerInput(editStock);
    const autoLimitNumber = parseIntegerInput(editAutoLimit);
    if (!editName.trim() || !Number.isFinite(priceNumber) || priceNumber < 0) return;
    if (!Number.isFinite(stockNumber) || stockNumber < 0) return;
    if (editAutoEnabled && (!Number.isFinite(autoLimitNumber) || autoLimitNumber <= 0)) return;

    setEditSaving(true);
    try {
      await updateProduct(userId, productId, {
        name: editName,
        description: editDescription,
        price: Math.round(priceNumber),
        imageFile: editImageFile,
      });
      await updateProductFulfillment(productId, {
        stockQuantity: Math.round(stockNumber),
        autoAcceptEnabled: editAutoEnabled,
        autoAcceptLimit: editAutoEnabled ? Math.round(autoLimitNumber) : 0,
      });
      cancelEdit();
      await reload();
    } catch (err) {
      if (err instanceof ProductError && err.code === 'IMAGE_TOO_LARGE') {
        setLoadError(t('ownerProducts.errorImageTooLarge'));
      } else {
        setLoadError(t('ownerProducts.errorGeneric'));
      }
    } finally {
      setEditSaving(false);
    }
  }

  const panelBody = (
    <>
        {!embedded && (
          <div style={styles.header}>
            <h3 style={styles.title}>{t('ownerProducts.title')}</h3>
            {onClose && (
              <button style={styles.closeButton} onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        )}

        <div style={styles.toolbar}>
          <button
            type="button"
            style={styles.addToggle}
            onClick={() => {
              setCreateFormOpen((open) => {
                if (open) resetCreateForm();
                return !open;
              });
            }}
          >
            {createFormOpen ? t('ownerProducts.addProductCollapse') : t('ownerProducts.addProductToggle')}
          </button>
        </div>

        {createFormOpen && (
        <div style={styles.formCard}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.fieldLabel}>{t('ownerProducts.nameLabel')}</label>
          <input
            style={styles.inputFull}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('ownerProducts.namePlaceholder')}
            maxLength={120}
          />
          <label style={styles.fieldLabel}>{t('ownerProducts.priceLabel')}</label>
          <input
            style={styles.inputFull}
            value={price}
            onChange={(e) => setPrice(formatIntegerInputRaw(e.target.value))}
            onBlur={() => blurFormatInteger(price, setPrice)}
            inputMode="numeric"
            maxLength={16}
          />
          <label style={styles.fieldLabel}>{t('ownerProducts.descriptionLabel')}</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('ownerProducts.descriptionPlaceholder')}
            maxLength={300}
            rows={2}
          />
          <label style={styles.fieldLabel}>{t('ownerProducts.editImageLabel')}</label>
          <div style={styles.formRow}>
            <div style={styles.imagePreviewWrap}>
              {previewUrl ? (
                <img src={previewUrl} alt="" style={styles.imagePreview} />
              ) : (
                <div style={styles.imagePlaceholder}>🖼️</div>
              )}
            </div>
            <button type="button" style={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
              {imageFile ? t('ownerProducts.imageChange') : t('ownerProducts.imageSelect')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button style={styles.submitButton} type="submit" disabled={submitting}>
              {submitting ? t('ownerProducts.submitting') : t('ownerProducts.submit')}
            </button>
          </div>
          {formError && <p style={styles.error}>{formError}</p>}
        </form>
        </div>
        )}

        <div style={styles.listArea}>
          {loading ? (
            <p style={styles.hint}>{t('ownerProducts.loading')}</p>
          ) : loadError ? (
            <p style={styles.error}>{loadError}</p>
          ) : products.length === 0 ? (
            <p style={styles.hint}>{t('ownerProducts.empty')}</p>
          ) : (
            <div style={styles.list}>
            {products.map((product) => (
              <div key={product.id} style={styles.card}>
                {editingId === product.id ? (
                  <div style={styles.editArea}>
                    <label style={styles.fieldLabel}>{t('ownerProducts.nameLabel')}</label>
                    <input
                      style={styles.inputFull}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t('ownerProducts.namePlaceholder')}
                      maxLength={120}
                    />
                    <label style={styles.fieldLabel}>{t('ownerProducts.priceLabel')}</label>
                    <input
                      style={styles.inputFull}
                      value={editPrice}
                      onChange={(e) => setEditPrice(formatIntegerInputRaw(e.target.value))}
                      onBlur={() => blurFormatInteger(editPrice, setEditPrice)}
                      inputMode="numeric"
                      maxLength={16}
                    />
                    <label style={styles.fieldLabel}>{t('ownerProducts.descriptionLabel')}</label>
                    <textarea
                      style={styles.textarea}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder={t('ownerProducts.descriptionPlaceholder')}
                      maxLength={300}
                      rows={2}
                    />
                    <label style={styles.fieldLabel}>{t('ownerProducts.editImageLabel')}</label>
                    <div style={styles.formRow}>
                      <div style={styles.imagePreviewWrapLarge}>
                        {editPreviewUrl ? (
                          <img src={editPreviewUrl} alt="" style={styles.imagePreview} />
                        ) : (
                          <div style={styles.imagePlaceholder}>🖼️</div>
                        )}
                      </div>
                      <button
                        type="button"
                        style={styles.fileButton}
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        {editImageFile ? t('ownerProducts.imageChange') : t('ownerProducts.imageChange')}
                      </button>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleEditFileChange}
                      />
                    </div>
                    <label style={styles.fieldLabel}>{t('ownerProducts.stockLabel')}</label>
                    <input
                      style={styles.inputFull}
                      value={editStock}
                      onChange={(e) => setEditStock(formatIntegerInputRaw(e.target.value))}
                      onBlur={() => blurFormatInteger(editStock, setEditStock)}
                      placeholder={t('ownerProducts.stockPlaceholder')}
                      inputMode="numeric"
                      maxLength={16}
                    />
                    <label style={styles.checkRow}>
                      <input
                        type="checkbox"
                        checked={editAutoEnabled}
                        onChange={(e) => setEditAutoEnabled(e.target.checked)}
                      />
                      <span>{t('ownerProducts.autoAcceptLabel')}</span>
                    </label>
                    {editAutoEnabled && (
                      <p style={styles.helpText}>{t('ownerProducts.autoAcceptIntro')}</p>
                    )}
                    {editAutoEnabled && (
                      <>
                        <label style={styles.fieldLabel}>{t('ownerProducts.autoAcceptQuotaLabel')}</label>
                        <input
                          style={styles.input}
                          value={editAutoLimit}
                          onChange={(e) => setEditAutoLimit(formatIntegerInputRaw(e.target.value))}
                          inputMode="numeric"
                          maxLength={12}
                          placeholder="400"
                        />
                        <p style={styles.helpText}>{t('ownerProducts.autoAcceptQuotaHelp')}</p>
                      </>
                    )}
                    <div style={styles.editActions}>
                      <button
                        style={styles.smallButton}
                        onClick={() => handleSaveEdit(product.id)}
                        disabled={editSaving}
                      >
                        {editSaving ? t('ownerProducts.submitting') : t('ownerProducts.save')}
                      </button>
                      <button style={styles.smallGhostButton} type="button" onClick={cancelEdit}>
                        {t('common.back')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.cardBody}>
                    <div style={styles.productThumbLarge}>
                      {product.image_url ? (
                        <img src={product.image_url} alt="" style={styles.productThumb} />
                      ) : (
                        <div style={styles.imagePlaceholder}>🖼️</div>
                      )}
                    </div>

                    <div style={styles.cardContent}>
                      <div style={styles.cardHeaderRow}>
                        <div style={styles.nameBlock}>
                          <span style={styles.productName}>{product.name}</span>
                          <div style={styles.badgeRow}>
                            {!product.is_active && (
                              <span style={styles.hiddenBadge}>{t('ownerProducts.hidden')}</span>
                            )}
                            {product.auto_accept_enabled && (
                              <span style={styles.autoAcceptOnBadge}>{t('ownerProducts.autoAcceptOnBadge')}</span>
                            )}
                          </div>
                        </div>
                        <strong style={styles.priceHighlight}>{formatPrice(product.price)}</strong>
                      </div>

                      {product.description ? (
                        <p style={styles.productDesc}>{product.description}</p>
                      ) : (
                        <p style={styles.productDescEmpty}>{t('ownerProducts.noDescription')}</p>
                      )}

                      <div style={styles.metaRow}>
                        <span style={styles.metaItem}>
                          {t('ownerProducts.stockHint', {
                            stock: formatIntegerDisplay(product.stock_quantity),
                          })}
                        </span>
                        {product.auto_accept_enabled && (
                          <span style={styles.autoAcceptChip}>
                            {t('ownerProducts.autoAcceptChip', {
                              n: formatIntegerDisplay(product.auto_accept_remaining),
                              limit: formatIntegerDisplay(product.auto_accept_limit),
                            })}
                          </span>
                        )}
                      </div>

                      <div style={styles.actionBar}>
                        <button style={styles.smallGhostButton} onClick={() => startEdit(product)}>
                          {t('ownerProducts.edit')}
                        </button>
                        <button style={styles.smallGhostButton} onClick={() => handleToggleActive(product)}>
                          {product.is_active ? t('ownerProducts.hide') : t('ownerProducts.show')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          )}
        </div>
    </>
  );

  if (embedded) {
    return (
      <section style={styles.embeddedPanel}>
        {panelBody}
      </section>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {panelBody}
      </div>
    </div>
  );
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

const styles: Record<string, React.CSSProperties> = {
  embeddedPanel: {
    background: oc.surface,
    borderRadius: 12,
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadow,
    overflow: 'hidden',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: oc.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: 16,
  },
  panel: {
    background: oc.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: 20,
    boxShadow: oc.shadowMd,
    border: `1px solid ${oc.border}`,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: oc.text, fontSize: fs.lg, margin: 0, fontWeight: 600 },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: oc.textMuted,
    fontSize: fs.md,
    cursor: 'pointer',
  },
  formCard: {
    padding: '0 20px 16px',
    background: oc.surface,
    borderBottom: `1px solid ${oc.border}`,
  },
  toolbar: {
    padding: '14px 20px',
    background: oc.surfaceMuted,
    borderBottom: `1px solid ${oc.border}`,
  },
  addToggle: {
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px solid ${oc.primary}`,
    background: oc.surface,
    color: oc.primary,
    fontSize: fs.base,
    fontWeight: 600,
    cursor: 'pointer',
  },
  form: {
    background: oc.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    border: `1px solid ${oc.border}`,
  },
  formRow: { display: 'flex', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
  },
  inputFull: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
  },
  priceInput: {
    width: 110,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  imagePreviewWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewWrapLarge: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: { width: '100%', height: '100%', objectFit: 'contain' },
  imagePlaceholder: { fontSize: fs.lg, color: oc.textMuted },
  fileButton: {
    padding: '9px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.textSecondary,
    fontSize: fs.sm,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  submitButton: {
    marginLeft: 'auto',
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.base,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  error: { color: oc.danger, fontSize: fs.sm, margin: 0 },
  hint: { color: oc.textMuted, fontSize: fs.base, textAlign: 'center', padding: '20px 0' },
  listArea: { padding: '16px 20px 20px', background: oc.pageBg },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: oc.surface,
    borderRadius: 12,
    padding: '18px 20px',
    border: `2px solid ${oc.borderStrong}`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  cardBody: {
    display: 'flex',
    gap: 18,
    alignItems: 'flex-start',
  },
  productThumbLarge: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productThumb: { width: '100%', height: '100%', objectFit: 'contain' },
  cardContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  nameBlock: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  productName: { color: oc.text, fontSize: fs.lg, fontWeight: 700, lineHeight: 1.35 },
  priceHighlight: { color: oc.price, fontSize: fs.xl, fontWeight: 700, whiteSpace: 'nowrap' },
  metaRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  metaItem: { color: oc.textSecondary, fontSize: fs.sm },
  autoAcceptChip: {
    fontSize: fs.xs,
    fontWeight: 600,
    color: oc.successText,
    background: oc.successBg,
    border: `1px solid ${oc.successBorder}`,
    borderRadius: 999,
    padding: '3px 10px',
  },
  actionBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  hiddenBadge: {
    fontSize: fs.xs,
    color: oc.warningText,
    border: `1px solid ${oc.warningBorder}`,
    background: oc.warningBg,
    borderRadius: 999,
    padding: '1px 8px',
  },
  autoAcceptOnBadge: {
    fontSize: fs.xs,
    fontWeight: 600,
    color: oc.successText,
    border: `1px solid ${oc.successBorder}`,
    background: oc.successBg,
    borderRadius: 999,
    padding: '3px 10px',
  },
  fieldLabel: { color: oc.textMuted, fontSize: fs.sm, marginTop: 2 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, color: oc.textSecondary, fontSize: fs.base },
  helpText: { color: oc.textMuted, fontSize: fs.xs, margin: '4px 0 0', lineHeight: 1.45 },
  productDesc: { color: oc.textSecondary, fontSize: fs.base, lineHeight: 1.55, margin: 0 },
  productDescEmpty: { color: oc.textMuted, fontSize: fs.sm, lineHeight: 1.55, margin: 0 },
  editArea: { display: 'flex', flexDirection: 'column', gap: 6 },
  editActions: { display: 'flex', gap: 8, marginTop: 6 },
  smallButton: {
    padding: '6px 12px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  smallGhostButton: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.textSecondary,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
};
