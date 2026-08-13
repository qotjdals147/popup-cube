import { useEffect, useState } from 'react';
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
  appearance = 'dark',
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
  const [reviewTarget, setReviewTarget] = useState<{ orderId: string; productId: string; productName: string } | null>(
    null
  );

  function reloadReviews() {
    return getProductReviews(product.id)
      .then((list) => setReviews(list))
      .catch(() => undefined);
  }

  async function loadReviewEligibility() {
    if (previewMode || !userId) return;
    try {
      const [orders, keys] = await Promise.all([listMyOrders(), getMyReviewKeys()]);
      let eligible: ReviewableOrder | null = null;
      let reviewedAny = false;
      for (const order of orders) {
        const item = order.items.find((it) => it.product_id === product.id);
        if (!item) continue;
        const key = reviewKey(order.id, product.id);
        if (keys.has(key)) {
          reviewedAny = true;
          continue;
        }
        if (!eligible && canFileClaim(order.status)) {
          eligible = { orderId: order.id, status: order.status };
        }
      }
      setReviewableOrder(eligible);
      setAlreadyReviewedByMe(reviewedAny);
    } catch {
      /* 리뷰 작성 가능 여부 확인 실패 시 버튼만 숨김 — 상세페이지 자체는 계속 보여줌 */
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const avgRating =
    reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : null;

  function handleAdd() {
    addToCart(storeId, product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  async function handleWriteReviewClick() {
    if (!reviewableOrder) return;

    if (reviewableOrder.status === 'purchase_confirmed' || reviewableOrder.status === 'completed') {
      setReviewTarget({ orderId: reviewableOrder.orderId, productId: product.id, productName: product.name });
      return;
    }

    // shipped / delivery_completed — 구매확정 없이는 리뷰를 못 남기니 먼저 물어봄 (§54와 동일 규칙)
    if (!window.confirm(t('review.needConfirmBody'))) return;

    setConfirmingForReview(true);
    try {
      await confirmPurchase(reviewableOrder.orderId);
      setReviewTarget({ orderId: reviewableOrder.orderId, productId: product.id, productName: product.name });
    } catch {
      /* 구매확정 실패 시 조용히 무시 — 「내 주문」에서 다시 시도 가능 */
    } finally {
      setConfirmingForReview(false);
    }
  }

  return (
    <div className={rootClass}>
    <div className="product-detail-overlay" style={styles.overlay} onClick={onClose}>
      <div className="product-detail-panel" style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className="product-detail-header" style={styles.header}>
          <button type="button" className="product-detail-back" style={styles.backButton} onClick={onClose} aria-label={t('productDetail.close')}>
            ←
          </button>
          <h3 className="product-detail-title" style={styles.title}>{product.name}</h3>
          {previewMode && <span style={styles.previewBadge}>{t('productDetail.previewBadge')}</span>}
        </div>

        <div style={styles.scrollArea}>
          <div style={styles.topSection}>
            <div className="product-detail-main-thumb-wrap" style={styles.mainThumbWrap}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} style={styles.mainThumb} />
              ) : (
                <div style={styles.mainThumbPlaceholder}>🛍️</div>
              )}
            </div>
            <div style={styles.topInfo}>
              <div className="product-detail-price" style={styles.price}>{formatPrice(product.price)}</div>
              {product.description && <p className="product-detail-short-desc" style={styles.shortDesc}>{product.description}</p>}
              {avgRating !== null && (
                <div style={styles.ratingSummaryInline}>
                  <Stars rating={Math.round(avgRating)} light={light} />
                  <span style={styles.ratingSummaryText}>
                    {t('productDetail.avgRating', { rating: String(avgRating) })} ·{' '}
                    {t('productDetail.reviewsCount', { count: reviews.length })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <p className="product-detail-hint" style={styles.hint}>{t('productDetail.loading')}</p>
          ) : (
            <>
              <section style={styles.section}>
                <h4 className="product-detail-section-title" style={styles.sectionTitle}>{t('productDetail.descTitle')}</h4>
                {detailBlocks.length === 0 ? (
                  <p className="product-detail-hint" style={styles.hint}>{t('productDetail.noDetail')}</p>
                ) : (
                  <div style={styles.blockStack}>
                    {detailBlocks.map((block) =>
                      block.block_type === 'image' ? (
                        block.image_url && (
                          <img key={block.id} src={block.image_url} alt="" loading="lazy" style={styles.detailImage} />
                        )
                      ) : block.text_content && block.text_content.trim() ? (
                        <div key={block.id} style={styles.detailDescBody}>
                          {block.text_content.split('\n').map((line, i) => (
                            <p key={i} className="product-detail-desc-line" style={styles.detailDescLine}>
                              {line || '\u00A0'}
                            </p>
                          ))}
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </section>

              <section style={styles.section}>
                <div style={styles.reviewsSectionHeader}>
                  <h4 className="product-detail-section-title" style={styles.sectionTitle}>
                    {t('productDetail.reviewsTitle')}
                    {reviews.length > 0 ? ` (${reviews.length})` : ''}
                  </h4>
                  {reviewableOrder && (
                    <button
                      type="button"
                      className="product-detail-write-review"
                      style={styles.writeReviewButton}
                      disabled={confirmingForReview}
                      onClick={() => void handleWriteReviewClick()}
                    >
                      {t('productDetail.writeReview')}
                    </button>
                  )}
                </div>
                {!reviewableOrder && alreadyReviewedByMe && (
                  <p style={styles.reviewedNote}>{t('productDetail.alreadyReviewedNote')}</p>
                )}
                {reviews.length === 0 ? (
                  <p style={styles.hint}>{t('productDetail.reviewsEmpty')}</p>
                ) : (
                  <div style={styles.reviewList}>
                    {reviews.map((r) => (
                      <div key={r.review_id} className="product-detail-review-card" style={styles.reviewCard}>
                        <div style={styles.reviewHeader}>
                          <Stars rating={r.rating} light={light} />
                          <span className="product-detail-review-nickname" style={styles.reviewNickname}>{r.reviewer_nickname ?? '익명'}</span>
                          <span style={styles.reviewDate}>{formatDate(r.created_at)}</span>
                        </div>
                        <p className="product-detail-review-body" style={styles.reviewBody}>{r.body}</p>
                        {r.image_urls.length > 0 && (
                          <div style={styles.reviewPhotoRow}>
                            {r.image_urls.map((url) => (
                              <img key={url} src={url} alt="" style={styles.reviewPhoto} />
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
          <div className="product-detail-buy-bar" style={styles.buyBar}>
            <div className="product-detail-stepper" style={styles.stepper}>
              <button className="product-detail-stepper-btn" style={styles.stepperButton} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="product-detail-stepper-value" style={styles.stepperValue}>{qty}</span>
              <button className="product-detail-stepper-btn" style={styles.stepperButton} onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
            <button type="button" className="product-detail-add-btn" style={styles.addButton} onClick={handleAdd}>
              {added ? t('productDetail.added') : t('productDetail.addToCart')}
            </button>
            <button type="button" className="product-detail-cart-link" style={styles.cartLink} onClick={onOpenCart}>
              {t('shop.cart')}
            </button>
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewFormModal
          orderId={reviewTarget.orderId}
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
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

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 65,
    padding: 12,
  },
  panel: {
    background: '#16213e',
    borderRadius: 16,
    width: '100%',
    maxWidth: 720,
    height: '100%',
    maxHeight: '96vh',
    boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid #2c4270',
    flexShrink: 0,
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#d8e4ff',
    fontSize: 20,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  title: { color: '#fff', fontSize: 16, margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0d1730',
    background: '#e9c46a',
    borderRadius: 999,
    padding: '3px 10px',
    flexShrink: 0,
  },
  scrollArea: { flex: 1, overflowY: 'auto', padding: 20 },
  topSection: { display: 'flex', gap: 14 },
  mainThumbWrap: {
    width: 130,
    height: 130,
    flexShrink: 0,
    borderRadius: 10,
    overflow: 'hidden',
    background: '#0d1730',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainThumb: { width: '100%', height: '100%', objectFit: 'contain' },
  mainThumbPlaceholder: { fontSize: 40, opacity: 0.4 },
  topInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  price: { color: '#e94560', fontSize: 18, fontWeight: 700 },
  shortDesc: { color: '#c9d4ee', fontSize: 12.5, lineHeight: 1.5, margin: 0 },
  ratingSummaryInline: { display: 'flex', alignItems: 'center', gap: 8 },
  ratingSummaryText: { color: '#a0a0c0', fontSize: 11.5 },
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '16px 0' },
  section: { marginTop: 22, borderTop: '1px solid #2c4270', paddingTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 10px' },
  reviewsSectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  writeReviewButton: {
    flexShrink: 0,
    padding: '5px 12px',
    borderRadius: 999,
    border: '1px solid #c9a962',
    background: 'transparent',
    color: '#e9c46a',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
  },
  reviewedNote: { color: '#8ce0b0', fontSize: 11.5, margin: '0 0 10px' },
  blockStack: { display: 'flex', flexDirection: 'column', gap: 14 },
  detailDescBody: { color: '#c9d4ee', fontSize: 13, lineHeight: 1.7 },
  detailDescLine: { margin: '0 0 6px' },
  detailImage: { width: '100%', height: 'auto', display: 'block', borderRadius: 6 },
  reviewList: { display: 'flex', flexDirection: 'column', gap: 12 },
  reviewCard: { background: '#0f3460', borderRadius: 10, padding: 12, border: '1px solid #2c4270' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  reviewNickname: { color: '#d8e4ff', fontSize: 12, fontWeight: 600 },
  reviewDate: { color: '#7c8db5', fontSize: 11, marginLeft: 'auto' },
  reviewBody: { color: '#c9d4ee', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' },
  reviewPhotoRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  reviewPhoto: { width: 64, height: 64, borderRadius: 8, objectFit: 'cover' },
  buyBar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderTop: '1px solid #2c4270',
    background: '#131c37',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #2c4270',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperButton: { width: 30, height: 30, border: 'none', background: '#0d1730', color: '#fff', fontSize: 15, cursor: 'pointer' },
  stepperValue: { width: 34, textAlign: 'center', color: '#fff', fontSize: 13 },
  addButton: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cartLink: {
    background: 'transparent',
    border: 'none',
    color: '#8ca4d8',
    fontSize: 12,
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
};
