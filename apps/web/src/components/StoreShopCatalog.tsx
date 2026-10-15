import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import { listActiveProducts } from '../lib/products';
import { getProductSkus } from '../lib/productSkus';
import {
  buildProductTagLabelMap,
  buildStoreTagFacets,
  getStoreProductTagsForShop,
  productMatchesTag,
  type StoreProductTagLink,
} from '../lib/storeProductTags';
import { useCart } from '../context/CartContext';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreShopTagFilter } from './StoreShopTagFilter';
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
  /** AD-088 2차 — URL `?tag=` 등 초기 태그 필터 */
  initialTagLabel?: string | null;
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

function syncUrlTagParam(tag: string | null) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (tag) params.set('tag', tag);
  else params.delete('tag');
  const qs = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

/** 매장 활성 상품 목록 · ShopPanel · StoreShopPage 공용 */
export function StoreShopCatalog({
  storeId,
  variant = 'overlay',
  onOpenCart,
  shoppingBlocked = false,
  initialProductId = null,
  initialTagLabel = null,
  storeBrowseUnlocked = true,
  storeName = null,
  storeThumbnailUrl = null,
  onExitToFeed,
  onEnterStoreBrowse,
}: StoreShopCatalogProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [tagLinks, setTagLinks] = useState<StoreProductTagLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTagLabel?.trim() || null);
  const [tagQuery, setTagQuery] = useState('');
  /** 상세 스택 — 연관·소식 탭 시 push · ← 뒤로가기 시 pop (§7.119) */
  const [detailStack, setDetailStack] = useState<Product[]>([]);
  /** 매장 홈으로 나갔을 때 복귀용 상세 스택 */
  const [returnDetailStack, setReturnDetailStack] = useState<Product[] | null>(null);

  const detailProduct = detailStack.length > 0 ? detailStack[detailStack.length - 1] : null;
  const detailCanPop = detailStack.length > 1;

  const tagFacets = useMemo(() => buildStoreTagFacets(tagLinks), [tagLinks]);
  const productTagMap = useMemo(() => buildProductTagLabelMap(tagLinks), [tagLinks]);

  const filteredProducts = useMemo(
    () => products.filter((p) => productMatchesTag(p.id, selectedTag, productTagMap)),
    [products, selectedTag, productTagMap]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    void Promise.all([listActiveProducts(storeId), getStoreProductTagsForShop(storeId)])
      .then(([data, links]) => {
        if (!mounted) return;
        setProducts(data);
        setTagLinks(links);
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
    const raw = initialTagLabel?.trim();
    if (!raw) return;
    setSelectedTag(raw);
  }, [initialTagLabel]);

  useEffect(() => {
    if (!selectedTag) return;
    const ok = tagFacets.some((f) => f.label === selectedTag);
    if (!ok && tagFacets.length > 0) {
      setSelectedTag(null);
      syncUrlTagParam(null);
    }
  }, [selectedTag, tagFacets]);

  useEffect(() => {
    if (!initialProductId || products.length === 0) return;
    const match = products.find((p) => p.id === initialProductId);
    if (match) setDetailStack([match]);
  }, [initialProductId, products]);

  const relatedForDetail = useMemo(() => {
    if (!detailProduct) return [];
    return products.filter((p) => p.id !== detailProduct.id).slice(0, 12);
  }, [products, detailProduct]);

  function openDetailProduct(product: Product, mode: 'push' | 'reset') {
    setReturnDetailStack(null);
    setDetailStack((prev) => {
      if (mode === 'push' && prev.length > 0) return [...prev, product];
      return [product];
    });
  }

  function navigateToProductId(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    openDetailProduct(p, detailStack.length > 0 ? 'push' : 'reset');
  }

  const applyTagFilter = useCallback(
    (label: string | null) => {
      setSelectedTag(label);
      syncUrlTagParam(label);
      setDetailStack([]);
      setReturnDetailStack(null);
      onEnterStoreBrowse?.();
    },
    [onEnterStoreBrowse]
  );

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
        openDetailProduct(product, 'reset');
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
    if (detailCanPop) {
      setDetailStack((prev) => prev.slice(0, -1));
      return;
    }
    if (productOnlyEntry && onExitToFeed) {
      onExitToFeed();
      return;
    }
    setDetailStack([]);
  }

  function handleEnterStoreFromDetail() {
    if (detailStack.length > 0) {
      setReturnDetailStack(detailStack);
    }
    setDetailStack([]);
    onEnterStoreBrowse?.();
  }

  function restoreReturnDetail() {
    if (!returnDetailStack?.length) return;
    setDetailStack(returnDetailStack);
    setReturnDetailStack(null);
  }

  const gridProducts = filteredProducts;

  return (
    <>
      {returnDetailStack && returnDetailStack.length > 0 && storeBrowseUnlocked && !detailProduct && (
        <div className="store-shop-return-detail">
          <button type="button" className="store-shop-return-detail__btn" onClick={restoreReturnDetail}>
            {t('shop.returnToPreviousProduct')}
          </button>
        </div>
      )}

      {storeBrowseUnlocked && tagFacets.length > 0 && (
        <StoreShopTagFilter
          facets={tagFacets}
          selectedTag={selectedTag}
          tagQuery={tagQuery}
          onSelectTag={applyTagFilter}
          onTagQueryChange={setTagQuery}
        />
      )}

      {storeBrowseUnlocked && selectedTag && gridProducts.length === 0 && (
        <p className="store-shop-hint">{t('shop.tagFilterEmpty')}</p>
      )}

      {storeBrowseUnlocked && gridProducts.length > 0 && (
      <div className={gridClass}>
        {gridProducts.map((product) => (
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
                  onClick={() => openDetailProduct(product, 'reset')}
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
          onSelectRelated={(p) => openDetailProduct(p, 'push')}
          onOpenProductId={navigateToProductId}
          onFilterByTag={(label) => applyTagFilter(label)}
          storeEntry={
            variant === 'page' && storeName
              ? {
                  name: storeName,
                  thumbnailUrl: storeThumbnailUrl,
                  onEnter: handleEnterStoreFromDetail,
                }
              : undefined
          }
          onClose={handleCloseDetail}
          onOpenCart={() => {
            setDetailStack([]);
            onOpenCart?.();
          }}
        />
      )}
    </>
  );
}
