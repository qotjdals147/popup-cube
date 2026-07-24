import { useEffect, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import { listActiveProducts } from '../lib/products';
import { useCart } from '../context/CartContext';
import { t } from '../i18n';

interface DisplayProductModalProps {
  storeId: string;
  fixtureLabel: string;
  onClose: () => void;
  onOpenCart: () => void;
}

/** 중앙 디스플레이 테이블 등 — 진열 구역 상호작용 팝업 (데모). */
export function DisplayProductModal({
  storeId,
  fixtureLabel,
  onClose,
  onOpenCart,
}: DisplayProductModalProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    listActiveProducts(storeId)
      .then((data) => {
        if (!mounted) return;
        const displayItems = data.slice(0, 3);
        setProducts(displayItems);
        setPreviewProduct(displayItems[0] ?? null);
      })
      .catch(() => {
        if (mounted) setError(t('display.errorLoad'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [storeId]);

  function handleAdd(product: Product) {
    addToCart(storeId, product, 1);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId((prev) => (prev === product.id ? null : prev)), 1200);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <p style={styles.kicker}>{fixtureLabel}</p>
            <h3 style={styles.title}>{t('display.title')}</h3>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
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
                  <button style={styles.addButton} onClick={() => handleAdd(previewProduct)}>
                    {addedId === previewProduct.id ? t('shop.added') : t('display.addToCart')}
                  </button>
                  <button style={styles.cartLink} onClick={onOpenCart}>
                    {t('display.openCart')}
                  </button>
                </div>

                <div style={styles.tryOnBox}>
                  <div style={styles.tryOnTitle}>{t('display.tryOnTitle')}</div>
                  <div style={styles.tryOnStage}>
                    <div style={styles.tryOnAvatar}>🧍</div>
                    <p style={styles.tryOnPlaceholder}>{t('display.tryOnPlaceholder')}</p>
                  </div>
                  <button style={styles.tryOnButton} disabled title={t('display.tryOnPlaceholder')}>
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
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
  tryOnPlaceholder: {
    margin: 0,
    color: '#8a94ad',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  tryOnButton: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #3a4560',
    background: '#1a2236',
    color: '#6a7490',
    cursor: 'not-allowed',
    fontSize: 12,
  },
};
