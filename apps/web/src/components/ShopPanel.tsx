import { useEffect, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import { listActiveProducts } from '../lib/products';
import { useCart } from '../context/CartContext';
import { t } from '../i18n';

interface ShopPanelProps {
  storeId: string;
  onClose: () => void;
  onOpenCart: () => void;
}

/** 쉬운 설명: 「전체 상품」버튼을 누르면 열리는, 이 매장의 전체 상품 목록 창. (장바구니와 다름) */
export function ShopPanel({ storeId, onClose, onOpenCart }: ShopPanelProps) {
  const { addToCart, totalQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    listActiveProducts(storeId)
      .then((data) => {
        if (mounted) setProducts(data);
      })
      .catch(() => {
        if (mounted) setError(t('shop.errorLoad'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [storeId]);

  function getQty(productId: string): number {
    return quantities[productId] ?? 1;
  }

  function setQty(productId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  }

  function handleAdd(product: Product) {
    addToCart(storeId, product, getQty(product.id));
    setAddedId(product.id);
    window.setTimeout(() => setAddedId((prev) => (prev === product.id ? null : prev)), 1200);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('shop.title')}</h3>
          <div style={styles.headerActions}>
            <button style={styles.cartButton} onClick={onOpenCart}>
              🛒 {t('shop.cart')} {totalQuantity > 0 ? `(${totalQuantity})` : ''}
            </button>
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <p style={styles.hint}>{t('shop.loading')}</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : products.length === 0 ? (
          <p style={styles.hint}>{t('shop.empty')}</p>
        ) : (
          <div style={styles.grid}>
            {products.map((product) => (
              <div key={product.id} style={styles.card}>
                <div style={styles.thumbWrap}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={styles.thumb} />
                  ) : (
                    <div style={styles.thumbPlaceholder}>🛍️</div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.name}>{product.name}</div>
                  <div style={styles.price}>{formatPrice(product.price)}</div>
                  {product.description && <div style={styles.desc}>{product.description}</div>}

                  <div style={styles.cardFooter}>
                    <div style={styles.stepper}>
                      <button
                        style={styles.stepperButton}
                        onClick={() => setQty(product.id, getQty(product.id) - 1)}
                      >
                        −
                      </button>
                      <span style={styles.stepperValue}>{getQty(product.id)}</span>
                      <button
                        style={styles.stepperButton}
                        onClick={() => setQty(product.id, getQty(product.id) + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button style={styles.addButton} onClick={() => handleAdd(product)}>
                      {addedId === product.id ? t('shop.added') : t('shop.addToCart')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: 16,
  },
  panel: {
    background: '#16213e',
    borderRadius: 14,
    width: '100%',
    maxWidth: 620,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: 20,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 17, margin: 0 },
  headerActions: { display: 'flex', gap: 10, alignItems: 'center' },
  cartButton: {
    padding: '7px 12px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#0f3460',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#a0a0c0',
    fontSize: 16,
    cursor: 'pointer',
  },
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12,
  },
  card: {
    background: '#0f3460',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  thumbWrap: {
    width: '100%',
    height: 120,
    background: '#0d1730',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // 사진을 잘라내지 않고 비율 그대로 박스 안에 전부 보이게 표시 (여백은 생길 수 있음).
  thumb: { width: '100%', height: '100%', objectFit: 'contain' },
  thumbPlaceholder: { fontSize: 32, opacity: 0.4 },
  cardBody: { padding: 12, display: 'flex', flexDirection: 'column', gap: 4 },
  name: { color: '#fff', fontSize: 14, fontWeight: 600 },
  price: { color: '#e94560', fontSize: 13, fontWeight: 600 },
  desc: { color: '#a0a0c0', fontSize: 12, lineHeight: 1.4 },
  cardFooter: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #2c4270',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 28,
    height: 28,
    border: 'none',
    background: '#0d1730',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
  stepperValue: {
    width: 32,
    textAlign: 'center',
    color: '#fff',
    fontSize: 13,
  },
  addButton: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
