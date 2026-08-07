import { useEffect, useState } from 'react';
import type { GachaRollResult, UserAddress } from '@popup-cube/shared';
import { useCart } from '../context/CartContext';
import { getActivePromotion, GachaError, rollGacha } from '../lib/gacha';
import { createAddress, listMyAddresses } from '../lib/addresses';
import { OrderError, placeOrder } from '../lib/orders';
import {
  AddressFormFields,
  EMPTY_ADDRESS_FORM,
  isAddressFormValid,
  type AddressFormValues,
} from './AddressFormFields';
import { t } from '../i18n';

interface CartDrawerProps {
  storeId: string;
  userId: string | null;
  onClose: () => void;
}

type Phase = 'cart' | 'address' | 'reward' | 'discountResult' | 'gachaRolling' | 'gachaResult';

function orderErrorMessage(err: unknown): string {
  if (err instanceof OrderError && err.message === 'insufficient_stock') return t('cart.insufficientStock');
  if (err instanceof OrderError) return t('cart.orderSaveError');
  if (err instanceof GachaError) return t('cart.gachaError');
  return t('cart.rewardError');
}

/**
 * 쉬운 설명: 장바구니 담긴 상품을 보고 수량을 +/- 조절하는 창.
 * "결제하기"는 아직 진짜 결제(PG)가 없는 mock 결제. 결제 흐름은 배송지 선택(AD-030) →
 * 할인/가챠 혜택 선택(AD-028) 순서로 진행되고, 마지막에 `place_order` 서버 함수로
 * 실제 `orders`/`order_items`에 저장됨(§10) — 가격은 서버가 다시 계산해서 조작을 막음.
 */
export function CartDrawer({ storeId, userId, onClose }: CartDrawerProps) {
  const { items, totalPrice, incrementQuantity, decrementQuantity, removeItem, clearCart } = useCart();
  const [phase, setPhase] = useState<Phase>('cart');

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [gachaResult, setGachaResult] = useState<GachaRollResult | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  function handleMockCheckout() {
    setPhase('address');
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
      const created = await createAddress(userId, { ...addressForm, is_default: false }, addresses.length === 0);
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

  function handleContinueToReward() {
    if (!selectedAddressId) {
      setAddressError(t('cart.addressRequired'));
      return;
    }
    setAddressError(null);
    setPhase('reward');
    setRewardError(null);
  }

  async function handleChooseDiscount() {
    setRewardError(null);
    try {
      const promo = await getActivePromotion(storeId);
      const percent = promo?.discount_percent ?? 0;
      const result = await placeOrder(storeId, selectedAddressId, items, 'discount', percent);
      setDiscountPercent(percent);
      setFinalTotal(result.totalAmount);
      setPhase('discountResult');
    } catch (err) {
      setRewardError(orderErrorMessage(err));
    }
  }

  async function handleChooseGacha() {
    setRewardError(null);
    setPhase('gachaRolling');
    try {
      const orderResult = await placeOrder(storeId, selectedAddressId, items, 'gacha', null);
      const result = await rollGacha(storeId, orderResult.orderId);
      setGachaResult(result);
      setPhase('gachaResult');
    } catch (err) {
      setRewardError(orderErrorMessage(err));
      setPhase('reward');
    }
  }

  function handleFinish() {
    clearCart();
    setPhase('cart');
    setDiscountPercent(null);
    setFinalTotal(null);
    setGachaResult(null);
    setSelectedAddressId(null);
    setAddresses([]);
    onClose();
  }

  const discountAmount =
    discountPercent && finalTotal !== null ? Math.max(0, totalPrice - finalTotal) : 0;
  const gachaLabel = gachaResult?.product_name ?? gachaResult?.exclusive_name ?? '';
  const gachaImage = gachaResult?.product_image_url ?? gachaResult?.exclusive_image_url ?? null;
  const gachaIsRealProduct = !!gachaResult?.product_id;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="play-cart-drawer" style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('cart.title')}</h3>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {phase === 'address' && (
          <div style={styles.addressStep}>
            <p style={styles.rewardTitle}>{t('cart.addressStepTitle')}</p>
            {addressLoading && <p style={styles.hint}>{t('cart.addressLoading')}</p>}
            {addressError && <p style={styles.error}>{addressError}</p>}

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
                      name="shippingAddress"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      style={styles.radio}
                    />
                    <div>
                      <div style={styles.addressLabelRow}>
                        <strong>{address.label}</strong>
                        {address.is_default && <span style={styles.defaultBadge}>{t('mypage.defaultBadge')}</span>}
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
              <button style={styles.addAddressButton} onClick={() => setAddAddressOpen(true)}>
                {t('cart.addNewAddress')}
              </button>
            ) : (
              <div style={styles.addAddressForm}>
                <AddressFormFields values={addressForm} onChange={setAddressForm} />
                <div style={styles.addAddressActions}>
                  {addresses.length > 0 && (
                    <button style={styles.rewardChoiceButtonSmall} onClick={() => setAddAddressOpen(false)}>
                      {t('mypage.cancel')}
                    </button>
                  )}
                  <button style={styles.checkoutButton} onClick={handleSaveNewAddress} disabled={savingAddress}>
                    {savingAddress ? t('mypage.saving') : t('mypage.save')}
                  </button>
                </div>
              </div>
            )}

            {!addAddressOpen && (
              <button style={{ ...styles.checkoutButton, marginTop: 14 }} onClick={handleContinueToReward}>
                {t('cart.addressContinue')}
              </button>
            )}
          </div>
        )}

        {phase === 'reward' && (
          <div style={styles.rewardStep}>
            <div style={styles.rewardIcon}>🎁</div>
            <p style={styles.rewardTitle}>{t('cart.rewardTitle')}</p>
            <p style={styles.rewardHint}>{t('cart.rewardHint')}</p>
            {rewardError && <p style={styles.error}>{rewardError}</p>}
            <div style={styles.rewardChoiceRow}>
              <button style={styles.rewardChoiceButton} onClick={handleChooseDiscount}>
                💸 {t('cart.chooseDiscount')}
              </button>
              <button style={styles.rewardChoiceButton} onClick={handleChooseGacha}>
                🎰 {t('cart.chooseGacha')}
              </button>
            </div>
          </div>
        )}

        {phase === 'gachaRolling' && (
          <div style={styles.orderComplete}>
            <div style={styles.orderCompleteIcon}>🎰</div>
            <p style={styles.orderCompleteText}>{t('cart.gachaRolling')}</p>
          </div>
        )}

        {phase === 'discountResult' && (
          <div style={styles.orderComplete}>
            <div style={styles.orderCompleteIcon}>💸</div>
            <p style={styles.orderCompleteText}>{t('cart.discountAppliedTitle', { percent: discountPercent ?? 0 })}</p>
            <p style={styles.orderCompleteHint}>
              {t('cart.discountAppliedHint', { amount: formatPrice(discountAmount) })}
            </p>
            <p style={styles.autoConfirmNote}>{t('cart.purchaseConfirmAutoRule')}</p>
            <button style={styles.checkoutButton} onClick={handleFinish}>
              {t('cart.confirm')}
            </button>
          </div>
        )}

        {phase === 'gachaResult' && gachaResult && (
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
            <p style={styles.autoConfirmNote}>{t('cart.purchaseConfirmAutoRule')}</p>
            <button style={{ ...styles.checkoutButton, marginTop: 16 }} onClick={handleFinish}>
              {t('cart.confirm')}
            </button>
          </div>
        )}

        {phase === 'cart' &&
          (items.length === 0 ? (
            <p style={styles.hint}>{t('cart.empty')}</p>
          ) : (
            <>
              <div style={styles.list}>
                {items.map((item) => (
                  <div key={item.productId} className="play-cart-row" style={styles.row}>
                    <div style={styles.thumbWrap}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={styles.thumb} />
                      ) : (
                        <div style={styles.thumbPlaceholder}>🛍️</div>
                      )}
                    </div>
                    <div className="play-cart-row-main">
                      <div className="play-cart-row-name" style={styles.name}>
                        {item.name}
                      </div>
                      <div style={styles.price}>{formatPrice(item.price)}</div>
                      <div className="play-cart-row-actions">
                        <div style={styles.stepper}>
                          <button style={styles.stepperButton} onClick={() => decrementQuantity(item.productId)}>
                            −
                          </button>
                          <span style={styles.stepperValue}>{item.quantity}</span>
                          <button style={styles.stepperButton} onClick={() => incrementQuantity(item.productId)}>
                            +
                          </button>
                        </div>
                        <div className="play-cart-line-total" style={styles.lineTotal}>
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        <button style={styles.removeButton} onClick={() => removeItem(item.productId)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.footer}>
                <div style={styles.totalRow}>
                  <span>{t('cart.total')}</span>
                  <strong style={styles.totalValue}>{formatPrice(totalPrice)}</strong>
                </div>
                <button style={styles.checkoutButton} onClick={handleMockCheckout}>
                  {t('cart.checkout')}
                </button>
              </div>
            </>
          ))}
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
    zIndex: 60,
    padding: 16,
  },
  panel: {
    background: '#16213e',
    borderRadius: 14,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: 20,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 17, margin: 0 },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#a0a0c0',
    fontSize: 16,
    cursor: 'pointer',
  },
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  error: { color: '#ff6b6b', fontSize: 12, margin: '0 0 10px' },
  list: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#0f3460',
    borderRadius: 10,
    padding: 10,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    background: '#0d1730',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 사진을 잘라내지 않고 비율 그대로 박스 안에 전부 보이게 표시 (여백은 생길 수 있음).
  thumb: { width: '100%', height: '100%', objectFit: 'contain' },
  thumbPlaceholder: { fontSize: 16, opacity: 0.4 },
  name: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.35,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },
  price: { color: '#a0a0c0', fontSize: 12 },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #2c4270',
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  stepperButton: {
    width: 24,
    height: 24,
    border: 'none',
    background: '#0d1730',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
  stepperValue: { width: 26, textAlign: 'center', color: '#fff', fontSize: 12 },
  lineTotal: {
    textAlign: 'right',
    color: '#e94560',
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  removeButton: {
    background: 'transparent',
    border: 'none',
    color: '#6f85b5',
    fontSize: 13,
    cursor: 'pointer',
    flexShrink: 0,
  },
  footer: { borderTop: '1px solid #2c4270', paddingTop: 14 },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  totalValue: { color: '#e94560', fontSize: 17 },
  checkoutButton: {
    width: '100%',
    padding: '13px',
    borderRadius: 10,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  orderComplete: { textAlign: 'center', padding: '24px 0' },
  orderCompleteIcon: { fontSize: 40, marginBottom: 10 },
  orderCompleteText: { color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 },
  orderCompleteHint: { color: '#a0a0c0', fontSize: 12, marginTop: 6, marginBottom: 18 },
  autoConfirmNote: { color: '#7c8db5', fontSize: 11, lineHeight: 1.5, margin: '0 0 14px' },
  rewardStep: { textAlign: 'center', padding: '10px 0 6px' },
  rewardIcon: { fontSize: 40, marginBottom: 8 },
  rewardTitle: { color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 },
  rewardHint: { color: '#a0a0c0', fontSize: 12, marginTop: 6, marginBottom: 16 },
  rewardChoiceRow: { display: 'flex', gap: 10 },
  rewardChoiceButton: {
    flex: 1,
    padding: '16px 10px',
    borderRadius: 10,
    border: '1px solid #2c4270',
    background: '#0f3460',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  rewardChoiceButtonSmall: {
    padding: '9px 16px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#a0a0c0',
    fontSize: 13,
    cursor: 'pointer',
  },
  gachaResultThumbWrap: {
    width: 96,
    height: 96,
    margin: '0 auto 10px',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#0d1730',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gachaResultThumb: { width: '100%', height: '100%', objectFit: 'contain' },
  gachaWonName: { color: '#e94560', fontSize: 16, fontWeight: 700, margin: '4px 0 10px' },
  gachaBadge: {
    display: 'inline-block',
    fontSize: 11,
    color: '#d8e4ff',
    border: '1px solid #4062a0',
    borderRadius: 999,
    padding: '3px 10px',
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
  addressLabelRow: { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 13, marginBottom: 2 },
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
    marginBottom: 4,
  },
  addAddressForm: { marginTop: 10, padding: 10, borderRadius: 10, background: '#0d1730' },
  addAddressActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
};
