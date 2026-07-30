import { useEffect, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import { listActiveProducts } from '../lib/products';
import { listFixtureDisplayProducts } from '../lib/displayFixtures';
import { useCart } from '../context/CartContext';
import { t } from '../i18n';

interface DisplayProductModalProps {
  storeId: string;
  fixtureLabel: string;
  /** DB display_fixtures.id — 있으면 슬롯 상품 우선 (Sprint 4-2) */
  fixtureId?: string | null;
  onClose: () => void;
  onOpenCart: () => void;
}

/** 진열 조형물 상호작용 팝업 — 슬롯 상품 · 담기 · 착용 미리보기 (AD-033) */
export function DisplayProductModal({
  storeId,
  fixtureLabel,
  fixtureId,
  onClose,
  onOpenCart,
}: DisplayProductModalProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setTryOnProduct(null);

    async function load() {
      try {
        let items: Product[] = [];
        if (fixtureId) {
          items = await listFixtureDisplayProducts(fixtureId);
        }
        // 슬롯 비어 있으면 매장 활성 상품 일부로 fallback (데모·빈 진열 대비)
        if (items.length === 0) {
          const all = await listActiveProducts(storeId);
          items = all.slice(0, 3);
        }
        if (!mounted) return;
        setProducts(items);
        setPreviewProduct(items[0] ?? null);
      } catch {
        if (mounted) setError(t('display.errorLoad'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [storeId, fixtureId]);

  function handleAdd(product: Product) {
    addToCart(storeId, product, 1);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId((prev) => (prev === product.id ? null : prev)), 1200);
  }

  function handleTryOn(product: Product) {
    setTryOnProduct(product);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <p style={styles.kicker}>{fixtureLabel}</p>
            <h3 style={styles.title}>{t('display.title')}</h3>
          </div>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <p style={styles.hint}>{t('display.loading')}</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : products.length === 0 ? (
          <p style={styles.hint}>{t('display.empty')}</p>
        ) : (
          <>
            <div style={styles.productRow}>
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  style={{
                    ...styles.productChip,
                    ...(previewProduct?.id === product.id ? styles.productChipActive : {}),
                  }}
                  onClick={() => setPreviewProduct(product)}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt="" style={styles.chipImg} />
                  ) : (
                    <span style={styles.chipEmoji}>👜</span>
                  )}
                  <span style={styles.chipName}>{product.name}</span>
                </button>
              ))}
            </div>

            {previewProduct && (
              <div style={styles.detail}>
                <div style={styles.detailInfo}>
                  <div style={styles.name}>{previewProduct.name}</div>
                  <div style={styles.price}>
                    {previewProduct.price.toLocaleString('ko-KR')}원
                  </div>
                  {previewProduct.description && (
                    <p style={styles.desc}>{previewProduct.description}</p>
                  )}
                  <button
                    type="button"
                    style={styles.addButton}
                    onClick={() => handleAdd(previewProduct)}
                  >
                    {addedId === previewProduct.id ? t('shop.added') : t('display.addToCart')}
                  </button>
                  <button type="button" style={styles.buySoon} disabled>
                    {t('display.buySoon')}
                  </button>
                  <button type="button" style={styles.cartLink} onClick={onOpenCart}>
                    {t('display.openCart')}
                  </button>
                </div>

                <div style={styles.tryOnBox}>
                  <div style={styles.tryOnTitle}>{t('display.tryOnTitle')}</div>
                  <div style={styles.tryOnStage}>
                    <div style={styles.tryOnAvatar}>🧍</div>
                    {tryOnProduct ? (
                      <>
                        {tryOnProduct.image_url ? (
                          <img
                            src={tryOnProduct.image_url}
                            alt=""
                            style={styles.tryOnItemImg}
                          />
                        ) : (
                          <span style={styles.tryOnItemEmoji}>✨</span>
                        )}
                        <p style={styles.tryOnApplied}>
                          {t('display.tryOnApplied', { name: tryOnProduct.name })}
                        </p>
                      </>
                    ) : (
                      <p style={styles.tryOnPlaceholder}>{t('display.tryOnHint')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    style={styles.tryOnButton}
                    onClick={() => handleTryOn(previewProduct)}
                  >
                    {t('store.hud.tryOn')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    padding: 16,
  },
  panel: {
    background: 'linear-gradient(160deg, #1a1520 0%, #16213e 55%)',
    border: '1px solid #c9a96255',
    borderRadius: 16,
    width: '100%',
    maxWidth: 640,
    maxHeight: '88vh',
    overflowY: 'auto',
    padding: 22,
    boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  kicker: { margin: 0, color: '#c9a962', fontSize: 12, letterSpacing: '0.04em' },
  title: { margin: '4px 0 0', color: '#fff', fontSize: 18 },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#a0a0c0',
    fontSize: 18,
    cursor: 'pointer',
  },
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '28px 0' },
  error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center', padding: '28px 0' },
  productRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  productChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid #2c4270',
    background: '#0f3460',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
  },
  productChipActive: {
    borderColor: '#c9a962',
    boxShadow: '0 0 0 1px #c9a96244',
  },
  chipImg: { width: 36, height: 36, borderRadius: 6, objectFit: 'cover' },
  chipEmoji: { fontSize: 22, width: 36, textAlign: 'center' },
  chipName: { maxWidth: 120, textAlign: 'left' },
  detail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  detailInfo: {
    background: '#0f3460',
    borderRadius: 12,
    padding: 16,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 6 },
  price: { color: '#c9a962', fontSize: 15, marginBottom: 10 },
  desc: { color: '#b8c0d8', fontSize: 12, lineHeight: 1.5, margin: '0 0 14px' },
  addButton: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: '#c9a962',
    color: '#1a1520',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 8,
  },
  buySoon: {
    width: '100%',
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #3a4560',
    background: '#1a2236',
    color: '#6a7490',
    cursor: 'not-allowed',
    fontSize: 12,
    marginBottom: 8,
  },
  cartLink: {
    width: '100%',
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#d0d8f0',
    cursor: 'pointer',
    fontSize: 12,
  },
  tryOnBox: {
    background: '#0b1020',
    borderRadius: 12,
    border: '1px dashed #c9a96266',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  tryOnTitle: { color: '#c9a962', fontSize: 13, fontWeight: 600 },
  tryOnStage: {
    flex: 1,
    minHeight: 160,
    borderRadius: 10,
    background: 'radial-gradient(circle at 50% 80%, #2a3548 0%, #0f1524 70%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  tryOnAvatar: { fontSize: 48, marginBottom: 8 },
  tryOnItemImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
    objectFit: 'cover',
    border: '1px solid #c9a96288',
    marginBottom: 8,
  },
  tryOnItemEmoji: { fontSize: 28, marginBottom: 6 },
  tryOnPlaceholder: {
    margin: 0,
    color: '#8a94ad',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  tryOnHint: {
    margin: 0,
    color: '#8a94ad',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  tryOnApplied: {
    margin: 0,
    color: '#d0d8f0',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  tryOnButton: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #c9a96288',
    background: '#1a2236',
    color: '#c9a962',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
};
