import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import { listActiveProducts } from '../lib/products';
import { getProductSkus } from '../lib/productSkus';
import { useCart } from '../context/CartContext';
import { ProductDetailModal } from './ProductDetailModal';
import { t } from '../i18n';

export interface StoreShopCatalogProps {
  storeId: string;
  /** overlay = ShopPanel modal grid · page = full-page shop (2-col mobile) */
  variant?: 'overlay' | 'page';
  onOpenCart?: () => void;
  /** §58 #5 — popup_ends_at 지난 매장: 담기·결제 차단 */
  shoppingBlocked?: boolean;
  /** AD-088 — 홈 피드 등에서 들어올 때 해당 상품 상세 자동 오픈 */
  initialProductId?: string | null;
  /** 홈·배ner 딥링크 — false면 상품 그리드 숨김 · 뒤로 = 피드 */
  storeBrowseUnlocked?: boolean;
  storeName?: string | null;
  storeThumbnailUrl?: string | null;
  onExitToFeed?: () => void;
  onEnterStoreBrowse?: () => void;
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

/** 매장 활성 상품 목록 · ShopPanel · StoreShopPage 공용 */
export function StoreShopCatalog({
  storeId,
  variant = 'overlay',
  onOpenCart,
  shoppingBlocked = false,
  initialProductId = null,
  storeBrowseUnlocked = true,
  storeName = null,
  storeThumbnailUrl = null,
  onExitToFeed,
  onEnterStoreBrowse,
}: StoreShopCatalogProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

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

  useEffect(() => {
    if (!initialProductId || products.length === 0) return;
    const match = products.find((p) => p.id === initialProductId);
    if (match) setDetailProduct(match);
  }, [initialProductId, products]);

  const relatedForDetail = useMemo(() => {
    if (!detailProduct) return [];
    return products.filter((p) => p.id !== detailProduct.id).slice(0, 12);
  }, [products, detailProduct]);

  function getQty(productId: string): number {
    return quantities[productId] ?? 1;
  }

  function setQty(productId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  }

  async function handleAdd(product: Product) {
    if (shoppingBlocked) return;
    try {
      const skuList = await getProductSkus(product.id);
      if (skuList.length > 0) {
        setDetailProduct(product);
        return;
      }
    } catch {
      /* 단일 재고 상품으로 처리 */
    }
    addToCart(storeId, product, getQty(product.id));
    setAddedId(product.id);
    window.setTimeout(() => setAddedId((prev) => (prev === product.id ? null : prev)), 1200);
  }

  const gridClass =
    variant === 'page' ? 'store-shop-grid store-shop-grid--page' : 'store-shop-grid';

  if (loading) {
    return <p className="store-shop-hint">{t('shop.loading')}</p>;
  }
  if (error) {
    return <p className="store-shop-error">{error}</p>;
  }
  if (products.length === 0) {
    return <p className="store-shop-hint">{t('shop.empty')}</p>;
  }

  const productOnlyEntry = Boolean(initialProductId) && !storeBrowseUnlocked;

  function handleCloseDetail() {
    if (productOnlyEntry && onExitToFeed) {
      onExitToFeed();
      return;
    }
    setDetailProduct(null);
  }

  function handleEnterStoreFromDetail() {
    onEnterStoreBrowse?.();
    setDetailProduct(null);
  }

  return (
    <>
      {storeBrowseUnlocked && (
      <div className={gridClass}>
        {products.map((product) => (
          <article key={product.id} className="store-shop-card">
            <div className="store-shop-card__thumb-wrap">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="store-shop-card__thumb" />
              ) : (
                <div className="store-shop-card__thumb-placeholder">🛍️</div>
              )}
            </div>
            <div className="store-shop-card__body">
              <div className="store-shop-card__name">{product.name}</div>
              <div className="store-shop-card__price">{formatPrice(product.price)}</div>
              {product.description && variant === 'overlay' && (
                <div className="store-shop-card__desc">{product.description}</div>
              )}

              <div className="store-shop-card__actions">
                <div className="store-shop-stepper store-shop-stepper--card">
                  <button
                    type="button"
                    className="store-shop-stepper__btn"
                    disabled={shoppingBlocked}
                    onClick={() => setQty(product.id, getQty(product.id) - 1)}
                  >
                    −
                  </button>
                  <span className="store-shop-stepper__value">{getQty(product.id)}</span>
                  <button
                    type="button"
                    className="store-shop-stepper__btn"
                    disabled={shoppingBlocked}
                    onClick={() => setQty(product.id, getQty(product.id) + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="store-shop-card__action-btn store-shop-card__action-btn--add"
                  disabled={shoppingBlocked}
                  onClick={() => void handleAdd(product)}
                >
                  {shoppingBlocked
                    ? t('storeShop.popupEndedShort')
                    : addedId === product.id
                      ? t('shop.added')
                      : t('shop.addToCart')}
                </button>
                <button
                  type="button"
                  className="store-shop-card__action-btn store-shop-card__action-btn--detail"
                  onClick={() => setDetailProduct(product)}
                >
                  {t('shop.viewDetail')}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      )}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          storeId={storeId}
          appearance={variant === 'page' ? 'light' : 'dark'}
          shoppingBlocked={shoppingBlocked}
          relatedProducts={relatedForDetail}
          onSelectRelated={(p) => setDetailProduct(p)}
          onOpenProductId={(id) => {
            const p = products.find((x) => x.id === id);
            if (p) setDetailProduct(p);
          }}
          storeEntry={
            variant === 'page' && productOnlyEntry && storeName
              ? {
                  name: storeName,
                  thumbnailUrl: storeThumbnailUrl,
                  onEnter: handleEnterStoreFromDetail,
                }
              : undefined
          }
          onClose={handleCloseDetail}
          onOpenCart={() => {
            setDetailProduct(null);
            onOpenCart?.();
          }}
        />
      )}
    </>
  );
}
