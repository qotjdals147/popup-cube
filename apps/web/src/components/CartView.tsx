import { useEffect, useMemo, useState } from 'react';
import type { GachaRollResult, StoreSummary, UserAddress } from '@popup-cube/shared';
import { useCart } from '../context/CartContext';
import { getActivePromotion, GachaError, rollGacha } from '../lib/gacha';
import { createAddress, listMyAddresses } from '../lib/addresses';
import { OrderError, placeOrder } from '../lib/orders';
import { getStoreSummary } from '../lib/stores';
import { calcShippingFee } from '../lib/storePolicy';
import {
  AddressFormFields,
  EMPTY_ADDRESS_FORM,
  isAddressFormValid,
  type AddressFormValues,
} from './AddressFormFields';
import { t } from '../i18n';
import '../styles/cart-drawer-shop.css';

interface CartViewProps {
  userId: string | null;
  /** drawer = 매장 쇼핑 중 오버레이 · page = 앱 장바구니 탭 전체화면 */
  layout?: 'drawer' | 'page';
  /** drawer일 때 결제 대상 매장 */
  storeId?: string;
  onClose?: () => void;
  appearance?: 'light' | 'dark';
}

type Phase = 'cart' | 'address' | 'reward' | 'discountResult' | 'gachaRolling' | 'gachaResult';

function orderErrorMessage(err: unknown): string {
  if (err instanceof OrderError && err.message === 'insufficient_stock') return t('cart.insufficientStock');
  if (err instanceof OrderError) return t('cart.orderSaveError');
  if (err instanceof GachaError) return t('cart.gachaError');
  return t('cart.rewardError');
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

function groupItemsByStore(items: ReturnType<typeof useCart>['items'], focusStoreId?: string) {
  const map = new Map<string, typeof items>();
  for (const item of items) {
    const group = map.get(item.storeId) ?? [];
    group.push(item);
    map.set(item.storeId, group);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (focusStoreId && a === focusStoreId) return -1;
      if (focusStoreId && b === focusStoreId) return 1;
      return 0;
    })
    .map(([groupStoreId, groupItems]) => ({ storeId: groupStoreId, items: groupItems }));
}

/**
 * 장바구니 본문 — mock 결제 · 매장별 `place_order`.
 */
export function CartView({
  userId,
  layout = 'drawer',
  storeId: focusStoreId,
  onClose,
  appearance = 'light',
}: CartViewProps) {
  const rootClass = appearance === 'light' ? 'cart-drawer--light' : 'cart-drawer--dark';
  const pageClass = layout === 'page' ? ' cart-view--page' : '';
  const { items, incrementQuantity, decrementQuantity, removeItem, clearStoreItems } = useCart();
  const [phase, setPhase] = useState<Phase>('cart');
  const [checkoutStoreId, setCheckoutStoreId] = useState<string | null>(focusStoreId ?? null);

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
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [storeInfoById, setStoreInfoById] = useState<Record<string, StoreSummary>>({});

  const activeStoreId = checkoutStoreId ?? focusStoreId ?? null;
  const checkoutItems = useMemo(
    () => (activeStoreId ? items.filter((item) => item.storeId === activeStoreId) : []),
    [items, activeStoreId],
  );
  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems],
  );
  const storeGroups = useMemo(() => groupItemsByStore(items, focusStoreId), [items, focusStoreId]);

  useEffect(() => {
    const ids = [...new Set(items.map((item) => item.storeId))];
    if (ids.length === 0) {
      setStoreNames({});
      setStoreInfoById({});
      return;
    }
    let active = true;
    Promise.all(
      ids.map((id) =>
        getStoreSummary(id)
          .then((s) => ({ id, summary: s }))
          .catch(() => ({ id, summary: null })),
      ),
    ).then((results) => {
      if (!active) return;
      setStoreNames(Object.fromEntries(results.map(({ id, summary }) => [id, summary?.name ?? id])));
      setStoreInfoById(
        Object.fromEntries(results.filter(({ summary }) => summary).map(({ id, summary }) => [id, summary!])),
      );
    });
    return () => {
      active = false;
    };
  }, [items]);

  const storeInfo = activeStoreId ? storeInfoById[activeStoreId] ?? null : null;
  const estimatedShipping = useMemo(() => {
    if (!storeInfo) return 0;
    return calcShippingFee(storeInfo, checkoutSubtotal);
  }, [storeInfo, checkoutSubtotal]);
  const estimatedPayTotal = checkoutSubtotal + estimatedShipping;

  function beginCheckout(forStoreId: string) {
    const groupItems = items.filter((item) => item.storeId === forStoreId);
    if (groupItems.length === 0) return;
    setCheckoutStoreId(forStoreId);
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
    if (!activeStoreId) return;
    setRewardError(null);
    try {
      const promo = await getActivePromotion(activeStoreId);
      const percent = promo?.discount_percent ?? 0;
      const result = await placeOrder(activeStoreId, selectedAddressId, checkoutItems, 'discount', percent);
      setDiscountPercent(percent);
      setFinalTotal(result.totalAmount);
      setPhase('discountResult');
    } catch (err) {
      setRewardError(orderErrorMessage(err));
    }
  }

  async function handleChooseGacha() {
    if (!activeStoreId) return;
    setRewardError(null);
    setPhase('gachaRolling');
    try {
      const orderResult = await placeOrder(activeStoreId, selectedAddressId, checkoutItems, 'gacha', null);
      const result = await rollGacha(activeStoreId, orderResult.orderId);
      setGachaResult(result);
      setPhase('gachaResult');
    } catch (err) {
      setRewardError(orderErrorMessage(err));
      setPhase('reward');
    }
  }

  function handleFinish() {
    if (activeStoreId) clearStoreItems(activeStoreId);
    setPhase('cart');
    setCheckoutStoreId(focusStoreId ?? null);
    setDiscountPercent(null);
    setFinalTotal(null);
    setGachaResult(null);
    setSelectedAddressId(null);
    setAddresses([]);
    if (layout === 'drawer') onClose?.();
  }

  const discountAmount =
    discountPercent && finalTotal !== null ? Math.max(0, checkoutSubtotal - finalTotal) : 0;
  const gachaLabel = gachaResult?.product_name ?? gachaResult?.exclusive_name ?? '';
  const gachaImage = gachaResult?.product_image_url ?? gachaResult?.exclusive_image_url ?? null;
  const gachaIsRealProduct = !!gachaResult?.product_id;
  const addressAppearance = appearance === 'light' ? 'light' : 'dark';

  function renderStoreFooter(forStoreId: string) {
    const groupItems = items.filter((item) => item.storeId === forStoreId);
    if (groupItems.length === 0) return null;
    const info = storeInfoById[forStoreId];
    const subtotal = groupItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = info ? calcShippingFee(info, subtotal) : 0;
    const payTotal = subtotal + shipping;

    return (
      <div className="cart-drawer-group-footer">
        <div className="cart-drawer-total-row">
          <span>{t('cart.total')}</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <div className="cart-drawer-total-row">
          <span>{t('cart.shippingFee')}</span>
          <strong>{shipping === 0 ? t('cart.shippingFree') : formatPrice(shipping)}</strong>
        </div>
        <div className="cart-drawer-total-row cart-drawer-total-row--pay">
          <span>{t('cart.payTotal')}</span>
          <strong>{formatPrice(payTotal)}</strong>
        </div>
        <button type="button" className="cart-drawer-primary-btn" onClick={() => beginCheckout(forStoreId)}>
          {t('cart.checkout')}
        </button>
      </div>
    );
  }

  const panel = (
    <div className={`cart-drawer-panel${pageClass ? ' cart-view-panel--page' : ''}`}>
      {layout === 'drawer' && (
        <div className="cart-drawer-header">
          <h3 className="cart-drawer-title">{t('cart.title')}</h3>
          <button type="button" className="cart-drawer-close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>
      )}

      {phase === 'address' && (
        <div className="cart-drawer-step">
          <p className="cart-drawer-step-title">{t('cart.addressStepTitle')}</p>
          {addressLoading && <p className="cart-drawer-hint">{t('cart.addressLoading')}</p>}
          {addressError && <p className="cart-drawer-error">{addressError}</p>}

          {!addressLoading && addresses.length === 0 && !addAddressOpen && (
            <p className="cart-drawer-hint">{t('cart.addressEmpty')}</p>
          )}

          {!addressLoading && addresses.length > 0 && (
            <div className="cart-drawer-address-list">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`cart-drawer-address-option${selectedAddressId === address.id ? ' cart-drawer-address-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="shippingAddress"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                  />
                  <div>
                    <div>
                      <strong>{address.label}</strong>
                      {address.is_default && ` · ${t('mypage.defaultBadge')}`}
                    </div>
                    <div>
                      {address.recipient_name} · {address.phone}
                    </div>
                    <div>
                      ({address.postal_code}) {address.address_line1} {address.address_line2 ?? ''}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {!addAddressOpen ? (
            <button type="button" className="cart-drawer-add-address-btn" onClick={() => setAddAddressOpen(true)}>
              {t('cart.addNewAddress')}
            </button>
          ) : (
            <div className="cart-drawer-add-address-form">
              <AddressFormFields values={addressForm} onChange={setAddressForm} appearance={addressAppearance} />
              <div className="cart-drawer-form-actions">
                {addresses.length > 0 && (
                  <button type="button" className="cart-drawer-secondary-btn" onClick={() => setAddAddressOpen(false)}>
                    {t('mypage.cancel')}
                  </button>
                )}
                <button type="button" className="cart-drawer-primary-btn" onClick={() => void handleSaveNewAddress()} disabled={savingAddress}>
                  {savingAddress ? t('mypage.saving') : t('mypage.save')}
                </button>
              </div>
            </div>
          )}

          {!addAddressOpen && (
            <button type="button" className="cart-drawer-primary-btn" style={{ marginTop: 14 }} onClick={handleContinueToReward}>
              {t('cart.addressContinue')}
            </button>
          )}
        </div>
      )}

      {phase === 'reward' && (
        <div className="cart-drawer-step cart-drawer-complete">
          <div className="cart-drawer-complete-icon">🎁</div>
          <p className="cart-drawer-step-title">{t('cart.rewardTitle')}</p>
          <p className="cart-drawer-step-hint">{t('cart.rewardHint')}</p>
          {rewardError && <p className="cart-drawer-error">{rewardError}</p>}
          <div className="cart-drawer-reward-row">
            <button type="button" className="cart-drawer-reward-btn" onClick={() => void handleChooseDiscount()}>
              💸 {t('cart.chooseDiscount')}
            </button>
            <button type="button" className="cart-drawer-reward-btn" onClick={() => void handleChooseGacha()}>
              🎰 {t('cart.chooseGacha')}
            </button>
          </div>
        </div>
      )}

      {phase === 'gachaRolling' && (
        <div className="cart-drawer-complete">
          <div className="cart-drawer-complete-icon">🎰</div>
          <p className="cart-drawer-complete-text">{t('cart.gachaRolling')}</p>
        </div>
      )}

      {phase === 'discountResult' && (
        <div className="cart-drawer-complete">
          <div className="cart-drawer-complete-icon">💸</div>
          <p className="cart-drawer-complete-text">{t('cart.discountAppliedTitle', { percent: discountPercent ?? 0 })}</p>
          <p className="cart-drawer-step-hint">{t('cart.discountAppliedHint', { amount: formatPrice(discountAmount) })}</p>
          <p className="cart-drawer-step-hint">{t('cart.purchaseConfirmAutoRule')}</p>
          <button type="button" className="cart-drawer-primary-btn" onClick={handleFinish}>
            {t('cart.confirm')}
          </button>
        </div>
      )}

      {phase === 'gachaResult' && gachaResult && (
        <div className="cart-drawer-complete">
          <div className="cart-drawer-complete-icon">
            {gachaImage ? <img src={gachaImage} alt={gachaLabel} style={{ width: 96, height: 96, objectFit: 'contain' }} /> : '🎉'}
          </div>
          <p className="cart-drawer-complete-text">{t('cart.gachaWonTitle')}</p>
          <p className="cart-drawer-complete-text" style={{ color: '#e94560' }}>
            {gachaLabel}
          </p>
          <span className="cart-drawer-gacha-type">
            {gachaIsRealProduct ? t('cart.gachaBadgeProduct') : t('cart.gachaBadgeExclusive')}
          </span>
          <p className="cart-drawer-step-hint">{t('cart.purchaseConfirmAutoRule')}</p>
          <button type="button" className="cart-drawer-primary-btn" style={{ marginTop: 16 }} onClick={handleFinish}>
            {t('cart.confirm')}
          </button>
        </div>
      )}

      {phase === 'cart' &&
        (items.length === 0 ? (
          <p className="cart-drawer-hint">{t('cart.empty')}</p>
        ) : (
          <>
            {storeGroups.map((group) => (
              <section
                key={group.storeId}
                className={`cart-drawer-store-group${focusStoreId && group.storeId === focusStoreId ? ' cart-drawer-store-group--current' : ''}`}
              >
                <div className="cart-drawer-store-header">
                  <h4 className="cart-drawer-store-name">{storeNames[group.storeId] ?? group.storeId}</h4>
                </div>
                <div className="cart-drawer-item-list">
                  {group.items.map((item) => (
                    <article key={item.productId} className="cart-drawer-item">
                      <div className="cart-drawer-item-thumb">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} />
                        ) : (
                          <span className="cart-drawer-item-thumb-placeholder">🛍️</span>
                        )}
                      </div>
                      <div className="cart-drawer-item-body">
                        <p className="cart-drawer-item-name">{item.name}</p>
                        <p className="cart-drawer-item-unit">{formatPrice(item.price)}</p>
                        <div className="cart-drawer-item-actions">
                          <div className="cart-drawer-item-row">
                            <div className="cart-drawer-stepper">
                              <button type="button" className="cart-drawer-qty-btn" onClick={() => decrementQuantity(item.productId)}>
                                −
                              </button>
                              <span className="cart-drawer-qty-value">{item.quantity}</span>
                              <button type="button" className="cart-drawer-qty-btn" onClick={() => incrementQuantity(item.productId)}>
                                +
                              </button>
                            </div>
                            <span className="cart-drawer-line-total">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                          <button type="button" className="cart-drawer-remove-btn" onClick={() => removeItem(item.productId)}>
                            {t('cart.removeItem')}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {layout === 'page' && renderStoreFooter(group.storeId)}
              </section>
            ))}

            {layout === 'drawer' && focusStoreId && (
              <>
                {checkoutItems.length === 0 ? (
                  <p className="cart-drawer-hint">{t('cart.emptyThisStore')}</p>
                ) : (
                  <div className="cart-drawer-footer">
                    <div className="cart-drawer-total-row">
                      <span>{t('cart.total')}</span>
                      <strong>{formatPrice(checkoutSubtotal)}</strong>
                    </div>
                    <div className="cart-drawer-total-row">
                      <span>{t('cart.shippingFee')}</span>
                      <strong>{estimatedShipping === 0 ? t('cart.shippingFree') : formatPrice(estimatedShipping)}</strong>
                    </div>
                    <div className="cart-drawer-total-row cart-drawer-total-row--pay">
                      <span>{t('cart.payTotal')}</span>
                      <strong>{formatPrice(estimatedPayTotal)}</strong>
                    </div>
                    <button type="button" className="cart-drawer-primary-btn" onClick={() => beginCheckout(focusStoreId)}>
                      {t('cart.checkout')}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ))}
    </div>
  );

  if (layout === 'page') {
    return <div className={`${rootClass} cart-view--page`}>{panel}</div>;
  }

  return (
    <div className={rootClass}>
      <div className="cart-drawer-overlay" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>{panel}</div>
      </div>
    </div>
  );
}
