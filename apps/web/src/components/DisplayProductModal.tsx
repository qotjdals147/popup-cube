import { useEffect, useState } from 'react';
import type { GachaRollResult, Product, UserAddress } from '@popup-cube/shared';
import { listActiveProducts } from '../lib/products';
import { listFixtureDisplayProducts } from '../lib/displayFixtures';
import { getActivePromotion, GachaError, rollGacha } from '../lib/gacha';
import { createAddress, listMyAddresses } from '../lib/addresses';
import { OrderError, placeOrder } from '../lib/orders';
import { useCart } from '../context/CartContext';
import {
  AddressFormFields,
  EMPTY_ADDRESS_FORM,
  isAddressFormValid,
  type AddressFormValues,
} from './AddressFormFields';
import { t } from '../i18n';

interface DisplayProductModalProps {
  storeId: string;
  fixtureLabel: string;
  /** DB display_fixtures.id — 있으면 슬롯 상품 우선 (Sprint 4-2) */
  fixtureId?: string | null;
  userId: string | null;
  onClose: () => void;
  onOpenCart: () => void;
}

type BuyPhase =
  | 'product'
  | 'address'
  | 'reward'
  | 'paying'
  | 'gachaRolling'
  | 'discountResult'
  | 'gachaResult';

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

function orderErrorMessage(err: unknown): string {
  if (err instanceof OrderError && err.message === 'insufficient_stock') return t('cart.insufficientStock');
  if (err instanceof OrderError) return t('cart.orderSaveError');
  if (err instanceof GachaError) return t('cart.gachaError');
  return t('cart.rewardError');
}

/** 진열 조형물 상호작용 팝업 — 슬롯 상품 · 담기 · 바로구매 mock · 착용 미리보기 (AD-033 · Sprint 4-4) */
export function DisplayProductModal({
  storeId,
  fixtureLabel,
  fixtureId,
  userId,
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

  const [buyPhase, setBuyPhase] = useState<BuyPhase>('product');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [gachaResult, setGachaResult] = useState<GachaRollResult | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setTryOnProduct(null);
    setBuyPhase('product');
    setBuyError(null);
    setRewardError(null);
    setOrderId(null);
    setOrderTotal(null);
    setDiscountPercent(null);
    setGachaResult(null);

    async function load() {
      try {
        let items: Product[] = [];
        if (fixtureId) {
          items = await listFixtureDisplayProducts(fixtureId);
        }
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

  function handleStartBuyNow() {
    if (!previewProduct) return;
    if (!userId) {
      setBuyError(t('display.buyNowNeedLogin'));
      return;
    }
    setBuyError(null);
    setBuyPhase('address');
    setAddressError(null);
    setAddressLoading(true);
    listMyAddresses()
      .then((data) => {
        setAddresses(data);
        const preferred = data.find((a) => a.is_default) ?? data[0] ?? null;
        setSelectedAddressId(preferred?.id ?? null);
        if (data.length === 0) setAddAddressOpen(true);
      })
      .catch(() => setAddressError(t('mypage.errorLoad')))
      .finally(() => setAddressLoading(false));
  }

  async function handleSaveNewAddress() {
    if (!userId) return;
    if (!isAddressFormValid(addressForm)) {
      setAddressError(t('mypage.errorRequired'));
      return;
    }
    setSavingAddress(true);
    setAddressError(null);
    try {
      const created = await createAddress(
        userId,
        { ...addressForm, is_default: false },
        addresses.length === 0
      );
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setAddAddressOpen(false);
      setAddressForm(EMPTY_ADDRESS_FORM);
    } catch {
      setAddressError(t('cart.addressSaveError'));
    } finally {
      setSavingAddress(false);
    }
  }

  function buildCartLine() {
    if (!previewProduct) return null;
    return {
      storeId,
      productId: previewProduct.id,
      name: previewProduct.name,
      price: previewProduct.price,
      quantity: 1,
      imageUrl: previewProduct.image_url ?? null,
    };
  }

  function handleContinueToReward() {
    if (!previewProduct || !selectedAddressId) {
      setAddressError(t('cart.addressRequired'));
      return;
    }
    setAddressError(null);
    setBuyError(null);
    setRewardError(null);
    setBuyPhase('reward');
  }

  async function handleChooseDiscount() {
    const cartLine = buildCartLine();
    if (!cartLine || !selectedAddressId) return;
    setRewardError(null);
    setBuyPhase('paying');
    try {
      const promo = await getActivePromotion(storeId);
      const percent = promo?.discount_percent ?? 0;
      if (percent <= 0) {
        setBuyPhase('reward');
        setRewardError(t('cart.discountUnavailable'));
        return;
      }
      const result = await placeOrder(storeId, selectedAddressId, [cartLine], 'discount', percent);
      setOrderId(result.orderId);
      setOrderRef(result.orderRef);
      setDiscountPercent(percent);
      setOrderTotal(result.totalAmount);
      setBuyPhase('discountResult');
    } catch (err) {
      setBuyPhase('reward');
      setRewardError(orderErrorMessage(err));
    }
  }

  async function handleChooseGacha() {
    const cartLine = buildCartLine();
    if (!cartLine || !selectedAddressId) return;
    setRewardError(null);
    setBuyPhase('gachaRolling');
    try {
      const orderResult = await placeOrder(storeId, selectedAddressId, [cartLine], 'gacha', null);
      setOrderId(orderResult.orderId);
      setOrderRef(orderResult.orderRef);
      setOrderTotal(orderResult.totalAmount);
      const result = await rollGacha(storeId, orderResult.orderId);
      setGachaResult(result);
      setBuyPhase('gachaResult');
    } catch (err) {
      setBuyPhase('reward');
      setRewardError(orderErrorMessage(err));
    }
  }

  function handleFinishBuy() {
    onClose();
  }

  const listPrice = previewProduct?.price ?? 0;
  const discountAmount =
    discountPercent != null && orderTotal != null ? Math.max(0, listPrice - orderTotal) : 0;
  const gachaLabel = gachaResult?.product_name ?? gachaResult?.exclusive_name ?? '';
  const gachaImage = gachaResult?.product_image_url ?? gachaResult?.exclusive_image_url ?? null;
  const gachaIsRealProduct = !!gachaResult?.product_id;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <p style={styles.kicker}>{fixtureLabel}</p>
            <h3 style={styles.title}>
              {buyPhase === 'address'
                ? t('cart.addressStepTitle')
                : buyPhase === 'reward' ||
                    buyPhase === 'discountResult' ||
                    buyPhase === 'gachaResult' ||
                    buyPhase === 'gachaRolling'
                  ? t('cart.rewardTitle')
                  : t('display.title')}
            </h3>
          </div>
          <button type="button" style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {buyPhase === 'paying' && (
          <p style={styles.hint}>{t('display.buyNowPaying')}</p>
        )}

        {buyPhase === 'reward' && (
          <div style={styles.rewardStep}>
            <div style={styles.rewardIcon}>🎁</div>
            <p style={styles.rewardTitle}>{t('cart.rewardTitle')}</p>
            <p style={styles.rewardHint}>{t('cart.rewardHint')}</p>
            {rewardError && <p style={styles.errorText}>{rewardError}</p>}
            <div style={styles.rewardChoiceRow}>
              <button type="button" style={styles.rewardChoiceButton} onClick={() => void handleChooseDiscount()}>
                💸 {t('cart.chooseDiscount')}
              </button>
              <button type="button" style={styles.rewardChoiceButton} onClick={() => void handleChooseGacha()}>
                🎰 {t('cart.chooseGacha')}
              </button>
            </div>
            <button type="button" style={{ ...styles.cartLink, marginTop: 12 }} onClick={() => setBuyPhase('address')}>
              {t('common.back')}
            </button>
          </div>
        )}

        {buyPhase === 'gachaRolling' && (
          <div style={styles.orderComplete}>
            <div style={styles.orderCompleteIcon}>🎰</div>
            <p style={styles.orderCompleteText}>{t('cart.gachaRolling')}</p>
          </div>
        )}

        {buyPhase === 'discountResult' && orderRef && orderTotal !== null && (
          <div style={styles.orderComplete}>
            <div style={styles.orderCompleteIcon}>💸</div>
            <p style={styles.orderCompleteText}>
              {t('cart.discountAppliedTitle', { percent: discountPercent ?? 0 })}
            </p>
            <p style={styles.orderCompleteHint}>
              {t('cart.discountAppliedHint', { amount: formatPrice(discountAmount) })}
            </p>
            <p style={styles.successMeta}>{t('display.buyNowOrderRef', { ref: orderRef })}</p>
            <p style={styles.successHint}>{t('display.buyNowMockHint')}</p>
            <p style={styles.autoConfirmNote}>{t('cart.purchaseConfirmAutoRule')}</p>
            <button type="button" style={styles.addButton} onClick={handleFinishBuy}>
              {t('cart.confirm')}
            </button>
          </div>
        )}

        {buyPhase === 'gachaResult' && gachaResult && orderRef && (
          <div style={styles.orderComplete}>
            <div style={styles.gachaResultThumbWrap}>
              {gachaImage ? (
                <img src={gachaImage} alt={gachaLabel} style={styles.gachaResultThumb} />
              ) : (
                <div style={styles.orderCompleteIcon}>🎉</div>
              )}
            </div>
            <p style={styles.orderCompleteText}>{t('cart.gachaWonTitle')}</p>
            <p style={styles.gachaWonName}>{gachaLabel}</p>
            <span style={styles.gachaBadge}>
              {gachaIsRealProduct ? t('cart.gachaBadgeProduct') : t('cart.gachaBadgeExclusive')}
            </span>
            <p style={styles.successMeta}>{t('display.buyNowOrderRef', { ref: orderRef })}</p>
            <p style={styles.autoConfirmNote}>{t('cart.purchaseConfirmAutoRule')}</p>
            <button type="button" style={{ ...styles.addButton, marginTop: 16 }} onClick={handleFinishBuy}>
              {t('cart.confirm')}
            </button>
          </div>
        )}

        {buyPhase === 'address' && (
          <div style={styles.addressStep}>
            {addressLoading && <p style={styles.hint}>{t('cart.addressLoading')}</p>}
            {addressError && <p style={styles.errorText}>{addressError}</p>}
            {buyError && <p style={styles.errorText}>{buyError}</p>}

            {!addressLoading && addresses.length === 0 && !addAddressOpen && (
              <p style={styles.hint}>{t('cart.addressEmpty')}</p>
            )}

            {!addressLoading && addresses.length > 0 && (
              <div style={styles.addressList}>
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    style={{
                      ...styles.addressOption,
                      ...(selectedAddressId === address.id ? styles.addressOptionSelected : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="displayBuyAddress"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      style={styles.radio}
                    />
                    <div>
                      <div style={styles.addressLabelRow}>
                        <strong>{address.label}</strong>
                        {address.is_default && (
                          <span style={styles.defaultBadge}>{t('mypage.defaultBadge')}</span>
                        )}
                      </div>
                      <div style={styles.addressText}>
                        {address.recipient_name} · {address.phone}
                      </div>
                      <div style={styles.addressText}>
                        ({address.postal_code}) {address.address_line1} {address.address_line2 ?? ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {!addAddressOpen ? (
              <button type="button" style={styles.addAddressButton} onClick={() => setAddAddressOpen(true)}>
                {t('cart.addNewAddress')}
              </button>
            ) : (
              <div style={styles.addAddressForm}>
                <AddressFormFields values={addressForm} onChange={setAddressForm} />
                <div style={styles.addAddressActions}>
                  <button
                    type="button"
                    style={styles.cartLink}
                    onClick={() => {
                      setAddAddressOpen(false);
                      setAddressForm(EMPTY_ADDRESS_FORM);
                    }}
                  >
                    {t('mypage.cancel')}
                  </button>
                  <button
                    type="button"
                    style={styles.buyButton}
                    disabled={savingAddress}
                    onClick={() => void handleSaveNewAddress()}
                  >
                    {savingAddress ? t('mypage.saving') : t('mypage.save')}
                  </button>
                </div>
              </div>
            )}

            {!addAddressOpen && (
              <button
                type="button"
                style={styles.buyButton}
                disabled={addressLoading || savingAddress}
                onClick={handleContinueToReward}
              >
                {t('cart.addressContinue')}
              </button>
            )}
            <button
              type="button"
              style={{ ...styles.cartLink, marginTop: 8 }}
              onClick={() => setBuyPhase('product')}
            >
              {t('mypage.cancel')}
            </button>
          </div>
        )}

        {buyPhase === 'product' && (
          <>
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
                      <button type="button" style={styles.buyButton} onClick={handleStartBuyNow}>
                        {t('display.buyNow')}
                      </button>
                      {buyError && <p style={styles.errorText}>{buyError}</p>}
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
                          <p style={styles.tryOnHint}>{t('display.tryOnHint')}</p>
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
  errorText: { color: '#ff6b6b', fontSize: 12, margin: '0 0 10px' },
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
  buyButton: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 8,
    fontSize: 14,
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
  successBox: { textAlign: 'center', padding: '8px 0 4px' },
  successTitle: { color: '#fff', fontSize: 17, fontWeight: 700, margin: '0 0 12px' },
  successMeta: { color: '#d0d8f0', fontSize: 14, margin: '0 0 8px' },
  successHint: { color: '#94a3b8', fontSize: 12, lineHeight: 1.5, margin: '12px 0 20px' },
  autoConfirmNote: { color: '#7c8db5', fontSize: 11, lineHeight: 1.5, margin: '0 0 14px' },
  rewardStep: { textAlign: 'center', padding: '10px 0 6px' },
  rewardIcon: { fontSize: 40, marginBottom: 8 },
  rewardTitle: { color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 },
  rewardHint: { color: '#a0a0c0', fontSize: 12, marginTop: 6, marginBottom: 16 },
  rewardChoiceRow: { display: 'flex', gap: 10 },
  rewardChoiceButton: {
    flex: 1,
    padding: '12px 10px',
    borderRadius: 10,
    border: '1px solid #2c4270',
    background: '#0f3460',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  orderComplete: { textAlign: 'center', padding: '12px 0 8px' },
  orderCompleteIcon: { fontSize: 44, marginBottom: 10 },
  orderCompleteText: { color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px' },
  orderCompleteHint: { color: '#a0a0c0', fontSize: 13, margin: '0 0 12px' },
  gachaResultThumbWrap: { display: 'flex', justifyContent: 'center', marginBottom: 10 },
  gachaResultThumb: { width: 88, height: 88, borderRadius: 10, objectFit: 'cover' },
  gachaWonName: { color: '#c9a962', fontSize: 15, fontWeight: 600, margin: '8px 0' },
  gachaBadge: {
    display: 'inline-block',
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 999,
    background: '#173a2c',
    color: '#8ce0b0',
    border: '1px solid #2c6b4a',
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
  addressStep: { padding: '4px 0' },
  addressList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  addressOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    border: '1px solid #2c4270',
    background: '#0f3460',
    cursor: 'pointer',
    textAlign: 'left',
  },
  addressOptionSelected: { border: '1px solid #e94560', background: '#2a1424' },
  radio: { marginTop: 3 },
  addressLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#fff',
    fontSize: 13,
    marginBottom: 2,
  },
  addressText: { color: '#a0a0c0', fontSize: 12 },
  defaultBadge: {
    fontSize: 10,
    color: '#d8e4ff',
    border: '1px solid #4062a0',
    borderRadius: 999,
    padding: '1px 7px',
  },
  addAddressButton: {
    width: '100%',
    padding: '10px',
    borderRadius: 10,
    border: '1px dashed #4062a0',
    background: '#13284d',
    color: '#d8e6ff',
    fontSize: 13,
    cursor: 'pointer',
    marginBottom: 12,
  },
  addAddressForm: { marginTop: 4, marginBottom: 12, padding: 10, borderRadius: 10, background: '#0d1730' },
  addAddressActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
};
