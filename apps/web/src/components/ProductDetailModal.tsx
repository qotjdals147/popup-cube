import { useEffect, useState, type CSSProperties } from 'react';
import type { OrderStatus, Product, ProductDetailBlock, ProductReview } from '@popup-cube/shared';
import { listProductDetailBlocks } from '../lib/productDetailBlocks';
import { getMyReviewKeys, getProductReviews, reviewKey } from '../lib/reviews';
import { canFileClaim, confirmPurchase, listMyOrders } from '../lib/orders';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ReviewFormModal } from './ReviewFormModal';
import { t } from '../i18n';
import '../styles/product-detail-shop.css';

interface ProductDetailModalProps {
  product: Product;
  storeId: string;
  onClose: () => void;
  onOpenCart: () => void;
  /** AD-059-2 — 점주가 「미리보기」로 열 때 true. 장바구니·리뷰 작성 등 손님 전용 동작은 숨김. */
  previewMode?: boolean;
  /** AD-065 — shop WebView 라이트 */
  appearance?: 'light' | 'dark';
}

/** layout = 항상 적용 · dark = 다크일 때만 추가(색·테두리) */
function styleFor(light: boolean, layout: CSSProperties, dark: CSSProperties = {}): CSSProperties {
  return light ? layout : { ...layout, ...dark };
}

interface ReviewableOrder {
  orderId: string;
  status: OrderStatus;
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function Stars({ rating, light = false }: { rating: number; light?: boolean }) {
  return (
    <span style={{ color: '#e9c46a', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(rating)}
      <span className={light ? 'product-detail-stars-dim' : undefined} style={{ color: light ? undefined : '#3a4a70' }}>
        {'★'.repeat(5 - rating)}
      </span>
    </span>
  );
}

/**
 * §54/§55(AD-059) — 상품 상세페이지. 「상세보기」로 진입하면 직접 쓴 설명 + 세로로 긴 상세 이미지들 +
 * 리뷰(별점/사진 포함)를 한 화면에서 볼 수 있음. 이미지가 아무리 길어도 width:100%로만 렌더링하니
 * 브라우저가 그대로 소화 가능 (지연 로딩으로 스크롤 성능도 챙김).
 *
 * 실제 라우트(URL) 이동 대신 **전체화면 시트**로 구현한 이유(AD-059-3):
 * 이 매장 화면은 Phaser 월드+소켓 연결 위에 오버레이로 쌓이는 구조라, react-router로 페이지를 옮기면
 * 게임 캔버스·소켓이 끊긴다. 대신 뒤로가기(←) 헤더 + 스크롤 본문 + 하단 고정 구매 바로 "전용 페이지" 느낌을 냄.
 */
export function ProductDetailModal({
  product,
  storeId,
  onClose,
  onOpenCart,
  previewMode = false,
  appearance = 'light',
}: ProductDetailModalProps) {
  const light = appearance === 'light';
  const rootClass = light ? 'product-detail--light' : undefined;
  const { addToCart } = useCart();
  const { userId } = useAuth();
  const [detailBlocks, setDetailBlocks] = useState<ProductDetailBlock[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const [reviewableOrder, setReviewableOrder] = useState<ReviewableOrder | null>(null);
  const [alreadyReviewedByMe, setAlreadyReviewedByMe] = useState(false);
  const [confirmingForReview, setConfirmingForReview] = useState(false);
  const [reviewConfirmError, setReviewConfirmError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ orderId: string; productId: string; productName: string } | null>(
    null
  );

  async function loadReviewEligibility() {
    if (previewMode || !userId) {
      setReviewableOrder(null);
      setAlreadyReviewedByMe(false);
      return;
    }
    try {
      const [orders, keys] = await Promise.all([listMyOrders(), getMyReviewKeys()]);
      let eligible: ReviewableOrder | null = null;
      let eligibleAt = '';
      let reviewedAny = false;
      for (const order of orders) {
        if (order.store_id !== storeId) continue;
        const item = order.items.find((it) => it.product_id === product.id);
        if (!item) continue;
        const key = reviewKey(order.id, product.id);
        if (keys.has(key)) {
          reviewedAny = true;
          continue;
        }
        if (canFileClaim(order.status) && (!eligible || order.created_at > eligibleAt)) {
          eligible = { orderId: order.id, status: order.status };
          eligibleAt = order.created_at;
        }
      }
      setReviewableOrder(eligible);
      setAlreadyReviewedByMe(reviewedAny);
    } catch {
      setReviewableOrder(null);
      setAlreadyReviewedByMe(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setReviewConfirmError(null);
    Promise.all([listProductDetailBlocks(product.id), getProductReviews(product.id)])
      .then(([blocks, reviewList]) => {
        if (!mounted) return;
        setDetailBlocks(blocks);
        setReviews(reviewList);
      })
      .catch(() => {
        /* 상세 정보 로드 실패 시 기본 정보만 보여줌 */
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    void loadReviewEligibility();
    return () => {
      mounted = false;
    };
  }, [product.id, userId, previewMode, storeId]);

  const avgRating =
    reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : null;

  function handleAdd() {
    addToCart(storeId, product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  function reloadReviews() {
    return getProductReviews(product.id)
      .then((list) => setReviews(list))
      .catch(() => undefined);
  }

  async function handleWriteReviewClick() {
    if (!reviewableOrder) return;
    setReviewConfirmError(null);

    if (reviewableOrder.status === 'purchase_confirmed' || reviewableOrder.status === 'completed') {
      setReviewTarget({ orderId: reviewableOrder.orderId, productId: product.id, productName: product.name });
      return;
    }

    if (!window.confirm(t('review.needConfirmBody'))) return;

    setConfirmingForReview(true);
    try {
      await confirmPurchase(reviewableOrder.orderId);
      setReviewableOrder({ orderId: reviewableOrder.orderId, status: 'purchase_confirmed' });
      setReviewTarget({ orderId: reviewableOrder.orderId, productId: product.id, productName: product.name });
    } catch {
      setReviewConfirmError(t('productDetail.reviewConfirmError'));
    } finally {
      setConfirmingForReview(false);
    }
  }

  const reviewNeedsConfirm =
    reviewableOrder &&
    reviewableOrder.status !== 'purchase_confirmed' &&
    reviewableOrder.status !== 'completed';

  return (
    <div className={rootClass}>
    <div className="product-detail-overlay" style={styleFor(light, S.overlayLayout, S.overlayDark)} onClick={onClose}>
      <div className="product-detail-panel" style={styleFor(light, S.panelLayout, S.panelDark)} onClick={(e) => e.stopPropagation()}>
        <div className="product-detail-header" style={styleFor(light, S.headerLayout, S.headerDark)}>
          <button type="button" className="product-detail-back" style={styleFor(light, S.backLayout, S.backDark)} onClick={onClose} aria-label={t('productDetail.close')}>
            ←
          </button>
          <h3 className="product-detail-title" style={styleFor(light, S.titleLayout, S.titleDark)}>{product.name}</h3>
          {previewMode && <span style={S.previewBadge}>{t('productDetail.previewBadge')}</span>}
        </div>

        <div style={S.scrollArea}>
          <div style={S.topSection}>
            <div className="product-detail-main-thumb-wrap" style={styleFor(light, S.thumbWrapLayout, S.thumbWrapDark)}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} style={S.mainThumb} />
              ) : (
                <div style={S.mainThumbPlaceholder}>🛍️</div>
              )}
            </div>
            <div style={S.topInfo}>
              <div className="product-detail-price" style={styleFor(light, S.priceLayout, S.priceDark)}>{formatPrice(product.price)}</div>
              {product.description && <p className="product-detail-short-desc" style={styleFor(light, S.shortDescLayout, S.shortDescDark)}>{product.description}</p>}
              {avgRating !== null && (
                <div style={S.ratingSummaryInline}>
                  <Stars rating={Math.round(avgRating)} light={light} />
                  <span className="product-detail-rating-text" style={styleFor(light, S.ratingTextLayout, S.ratingTextDark)}>
                    {t('productDetail.avgRating', { rating: String(avgRating) })} ·{' '}
                    {t('productDetail.reviewsCount', { count: reviews.length })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <p className="product-detail-hint" style={styleFor(light, S.hintLayout, S.hintDark)}>{t('productDetail.loading')}</p>
          ) : (
            <>
              <section className="product-detail-section" style={styleFor(light, S.sectionLayout, S.sectionDark)}>
                <h4 className="product-detail-section-title" style={styleFor(light, S.sectionTitleLayout, S.sectionTitleDark)}>{t('productDetail.descTitle')}</h4>
                {detailBlocks.length === 0 ? (
                  <p className="product-detail-hint" style={styleFor(light, S.hintLayout, S.hintDark)}>{t('productDetail.noDetail')}</p>
                ) : (
                  <div style={S.blockStack}>
                    {detailBlocks.map((block) =>
                      block.block_type === 'image' ? (
                        block.image_url && (
                          <img key={block.id} src={block.image_url} alt="" loading="lazy" style={S.detailImage} />
                        )
                      ) : block.text_content && block.text_content.trim() ? (
                        <div key={block.id} className="product-detail-desc-body" style={styleFor(light, S.descBodyLayout, S.descBodyDark)}>
                          {block.text_content.split('\n').map((line, i) => (
                            <p key={i} className="product-detail-desc-line" style={S.descLineLayout}>
                              {line || '\u00A0'}
                            </p>
                          ))}
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </section>

              <section className="product-detail-section" style={styleFor(light, S.sectionLayout, S.sectionDark)}>
                <div style={S.reviewsSectionHeader}>
                  <h4 className="product-detail-section-title" style={styleFor(light, S.sectionTitleLayout, S.sectionTitleDark)}>
                    {t('productDetail.reviewsTitle')}
                    {reviews.length > 0 ? ` (${reviews.length})` : ''}
                  </h4>
                  {reviewableOrder && (
                    <div style={S.reviewWriteCol}>
                      <button
                        type="button"
                        className="product-detail-write-review"
                        style={styleFor(light, S.writeReviewLayout, S.writeReviewDark)}
                        disabled={confirmingForReview}
                        onClick={() => void handleWriteReviewClick()}
                      >
                        {t('productDetail.writeReview')}
                      </button>
                      <p className="product-detail-review-hint" style={styleFor(light, S.reviewHintLayout, S.reviewHintDark)}>
                        {reviewNeedsConfirm
                          ? t('productDetail.reviewNeedConfirmHint')
                          : t('productDetail.reviewPurchaserHint')}
                      </p>
                    </div>
                  )}
                </div>
                {reviewConfirmError && (
                  <p className="product-detail-review-error" style={styleFor(light, S.reviewErrorLayout, S.reviewErrorDark)}>
                    {reviewConfirmError}
                  </p>
                )}
                {!reviewableOrder && alreadyReviewedByMe && (
                  <p className="product-detail-reviewed-note" style={styleFor(light, S.reviewedNoteLayout, S.reviewedNoteDark)}>{t('productDetail.alreadyReviewedNote')}</p>
                )}
                {reviews.length === 0 ? (
                  <p className="product-detail-hint" style={styleFor(light, S.hintLayout, S.hintDark)}>{t('productDetail.reviewsEmpty')}</p>
                ) : (
                  <div style={S.reviewList}>
                    {reviews.map((r) => (
                      <div key={r.review_id} className="product-detail-review-card" style={styleFor(light, S.reviewCardLayout, S.reviewCardDark)}>
                        <div style={S.reviewHeader}>
                          <Stars rating={r.rating} light={light} />
                          <span className="product-detail-review-nickname" style={styleFor(light, S.reviewNickLayout, S.reviewNickDark)}>{r.reviewer_nickname ?? '익명'}</span>
                          <span className="product-detail-review-date" style={styleFor(light, S.reviewDateLayout, S.reviewDateDark)}>{formatDate(r.created_at)}</span>
                        </div>
                        <p className="product-detail-review-body" style={styleFor(light, S.reviewBodyLayout, S.reviewBodyDark)}>{r.body}</p>
                        {r.image_urls.length > 0 && (
                          <div style={S.reviewPhotoRow}>
                            {r.image_urls.map((url) => (
                              <img key={url} src={url} alt="" style={S.reviewPhoto} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {!previewMode && (
          <div className="product-detail-buy-bar" style={styleFor(light, S.buyBarLayout, S.buyBarDark)}>
            <div className="product-detail-stepper" style={styleFor(light, S.stepperLayout, S.stepperDark)}>
              <button type="button" className="product-detail-stepper-btn" style={styleFor(light, S.stepperBtnLayout, S.stepperBtnDark)} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="product-detail-stepper-value" style={styleFor(light, S.stepperValueLayout, S.stepperValueDark)}>{qty}</span>
              <button type="button" className="product-detail-stepper-btn" style={styleFor(light, S.stepperBtnLayout, S.stepperBtnDark)} onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
            <button type="button" className="product-detail-add-btn" style={styleFor(light, S.addBtnLayout, S.addBtnDark)} onClick={handleAdd}>
              {added ? t('productDetail.added') : t('productDetail.addToCart')}
            </button>
            <button type="button" className="product-detail-cart-btn" style={styleFor(light, S.cartBtnLayout, S.cartBtnDark)} onClick={onOpenCart}>
              🛒 {t('shop.cart')}
            </button>
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewFormModal
          orderId={reviewTarget.orderId}
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
          appearance={appearance}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            void reloadReviews();
            void loadReviewEligibility();
          }}
        />
      )}
    </div>
    </div>
  );
}

const S = {
  overlayLayout: {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 65,
    padding: 12,
  },
  overlayDark: { background: 'rgba(0,0,0,0.55)' },
  panelLayout: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 720,
    height: '100%',
    maxHeight: '96vh',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  panelDark: { background: '#16213e', boxShadow: '0 16px 40px rgba(0,0,0,0.55)' },
  headerLayout: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    flexShrink: 0,
  },
  headerDark: { borderBottom: '1px solid #2c4270' },
  backLayout: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 },
  backDark: { color: '#d8e4ff' },
  titleLayout: {
    fontSize: 16,
    margin: 0,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  titleDark: { color: '#fff' },
  previewBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0d1730',
    background: '#e9c46a',
    borderRadius: 999,
    padding: '3px 10px',
    flexShrink: 0,
  },
  scrollArea: { flex: 1, overflowY: 'auto' as const, padding: 20 },
  topSection: { display: 'flex', gap: 14 },
  thumbWrapLayout: {
    width: 130,
    height: 130,
    flexShrink: 0,
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWrapDark: { background: '#0d1730' },
  mainThumb: { width: '100%', height: '100%', objectFit: 'contain' as const },
  mainThumbPlaceholder: { fontSize: 40, opacity: 0.4 },
  topInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  priceLayout: { fontSize: 18, fontWeight: 700 },
  priceDark: { color: '#e94560' },
  shortDescLayout: { fontSize: 12.5, lineHeight: 1.5, margin: 0 },
  shortDescDark: { color: '#c9d4ee' },
  ratingSummaryInline: { display: 'flex', alignItems: 'center', gap: 8 },
  ratingTextLayout: { fontSize: 11.5 },
  ratingTextDark: { color: '#a0a0c0' },
  hintLayout: { fontSize: 13, textAlign: 'center' as const, padding: '16px 0' },
  hintDark: { color: '#a0a0c0' },
  sectionLayout: { marginTop: 22, paddingTop: 16 },
  sectionDark: { borderTop: '1px solid #2c4270' },
  sectionTitleLayout: { fontSize: 14, fontWeight: 700, margin: '0 0 10px' },
  sectionTitleDark: { color: '#fff' },
  reviewsSectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  writeReviewLayout: {
    flexShrink: 0,
    padding: '5px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
  },
  writeReviewDark: { border: '1px solid #c9a962', background: 'transparent', color: '#e9c46a' },
  reviewWriteCol: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 4, maxWidth: 160 },
  reviewHintLayout: { fontSize: 10, lineHeight: 1.4, margin: 0, textAlign: 'right' as const },
  reviewHintDark: { color: '#7c8db5' },
  reviewErrorLayout: { fontSize: 11.5, margin: '0 0 8px', color: '#e03131' },
  reviewErrorDark: { color: '#ff8787' },
  reviewedNoteLayout: { fontSize: 11.5, margin: '0 0 10px' },
  reviewedNoteDark: { color: '#8ce0b0' },
  blockStack: { display: 'flex', flexDirection: 'column' as const, gap: 14 },
  descBodyLayout: { fontSize: 13, lineHeight: 1.7 },
  descBodyDark: { color: '#c9d4ee' },
  descLineLayout: { margin: '0 0 6px' },
  detailImage: { width: '100%', height: 'auto', display: 'block', borderRadius: 6 },
  reviewList: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  reviewCardLayout: { borderRadius: 10, padding: 12 },
  reviewCardDark: { background: '#0f3460', border: '1px solid #2c4270' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' as const },
  reviewNickLayout: { fontSize: 12, fontWeight: 600 },
  reviewNickDark: { color: '#d8e4ff' },
  reviewDateLayout: { fontSize: 11, marginLeft: 'auto' },
  reviewDateDark: { color: '#7c8db5' },
  reviewBodyLayout: { fontSize: 12.5, lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' as const },
  reviewBodyDark: { color: '#c9d4ee' },
  reviewPhotoRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  reviewPhoto: { width: 64, height: 64, borderRadius: 8, objectFit: 'cover' as const },
  buyBarLayout: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
  },
  buyBarDark: { borderTop: '1px solid #2c4270', background: '#131c37' },
  stepperLayout: { display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden' },
  stepperDark: { border: '1px solid #2c4270' },
  stepperBtnLayout: { width: 32, height: 32, border: 'none', fontSize: 15, cursor: 'pointer' },
  stepperBtnDark: { background: '#0d1730', color: '#fff' },
  stepperValueLayout: { width: 36, textAlign: 'center' as const, fontSize: 14, fontWeight: 600, lineHeight: '32px' },
  stepperValueDark: { color: '#fff' },
  addBtnLayout: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  addBtnDark: { background: '#e94560', color: '#fff' },
  cartBtnLayout: {
    flexShrink: 0,
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cartBtnDark: { border: '1px solid #4062a0', background: 'transparent', color: '#8ca4d8' },
};
