import { useEffect, useMemo, useState } from 'react';
import type { GachaRollResult, StoreSummary, UserAddress } from '@popup-cube/shared';
import { useCart } from '../context/CartContext';
import { getActivePromotion, GachaError, rollGacha } from '../lib/gacha';
import { createAddress, listMyAddresses } from '../lib/addresses';
import { OrderError, placeOrder } from '../lib/orders';
import { getStoreSummary } from '../lib/stores';
import { isPopupEnded } from '../lib/popupPeriod';
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
  /** page = 앱 장바구니 탭 · drawer = 매장 쇼핑 중 오버레이 (동일 localStorage · 동일 UI) */
  layout?: 'drawer' | 'page';
  /** 목록 정렬 시 현재 매장을 위로 (별도 장바구니 아님) */
  storeId?: string;
  onClose?: () => void;
  appearance?: 'light' | 'dark';
}

type Phase = 'cart' | 'address' | 'reward' | 'discountResult' | 'gachaRolling' | 'gachaResult';

function orderErrorMessage(err: unknown): string {
  if (err instanceof OrderError && err.message === 'insufficient_stock') return t('cart.insufficientStock');
  if (err instanceof OrderError && err.message.includes('popup_ended')) return t('cart.popupEnded');
  if (err instanceof OrderError && err.message.includes('no_valid_items')) return t('cart.orderNoValidItems');
  if (err instanceof OrderError && err.message.includes('discount_mismatch')) return t('cart.orderDiscountMismatch');
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
 * 장바구니 — localStorage 1개 · 화면도 탭/매장 서랍 동일 · 결제만 매장별 `place_order`.
 */
export function CartView({
  userId,
  layout = 'drawer',
  storeId: focusStoreId,
  onClose,
  appearance = 'light',
}: CartViewProps) {
  const rootClass = appearance === 'light' ? 'cart-drawer--light' : 'cart-drawer--dark';
  const { items, incrementQuantity, decrementQuantity, removeItem, removeItemsByProductIds } = useCart();
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  /** 결제 성공 직후 — 해당 줄만 장바구니에서 제거 (매장 storeId 통째 삭제 방지) */
  const [lastOrderedProductIds, setLastOrderedProductIds] = useState<string[]>([]);

  const isPageLayout = layout === 'page';
  const activeStoreId = checkoutStoreId ?? focusStoreId ?? null;

  useEffect(() => {
    setSelectedIds(new Set(items.map((item) => item.productId)));
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.productId)),
    [items, selectedIds],
  );
  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );
  const storesWithSelection = useMemo(
    () => [...new Set(selectedItems.map((item) => item.storeId))],
    [selectedItems],
  );
  const singleCheckoutStoreId = storesWithSelection.length === 1 ? storesWithSelection[0] : null;

  const checkoutItems = useMemo(
    () =>
      activeStoreId
        ? items.filter((item) => item.storeId === activeStoreId && selectedIds.has(item.productId))
        : [],
    [items, activeStoreId, selectedIds],
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

  function toggleProduct(productId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function toggleStoreProducts(storeId: string) {
    const storeProductIds = items.filter((item) => item.storeId === storeId).map((item) => item.productId);
    const allInStore = storeProductIds.length > 0 && storeProductIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of storeProductIds) {
        if (allInStore) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function toggleAllProducts() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.productId)));
    }
  }

  function isStoreCheckoutBlocked(forStoreId: string): boolean {
    const info = storeInfoById[forStoreId];
    return info ? isPopupEnded(info.popup_ends_at) : false;
  }

  function beginCheckout(forStoreId: string) {
    if (isStoreCheckoutBlocked(forStoreId)) return;
    const groupItems = items.filter(
      (item) => item.storeId === forStoreId && selectedIds.has(item.productId),
    );
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
    const ordering = [...checkoutItems];
    try {
      const promo = await getActivePromotion(activeStoreId);
      const percent = promo?.discount_percent ?? 0;
      const result = await placeOrder(activeStoreId, selectedAddressId, ordering, 'discount', percent);
      setLastOrderedProductIds(ordering.map((item) => item.productId));
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
    const ordering = [...checkoutItems];
    try {
      const orderResult = await placeOrder(activeStoreId, selectedAddressId, ordering, 'gacha', null);
      setLastOrderedProductIds(ordering.map((item) => item.productId));
      const result = await rollGacha(activeStoreId, orderResult.orderId);
      setGachaResult(result);
      setPhase('gachaResult');
    } catch (err) {
      setRewardError(orderErrorMessage(err));
      setPhase('reward');
    }
  }

  function handleFinish() {
    const ids =
      lastOrderedProductIds.length > 0
        ? lastOrderedProductIds
        : checkoutItems.map((item) => item.productId);
    removeItemsByProductIds(ids);
    setLastOrderedProductIds([]);
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

  function renderStickyFooter() {
    if (phase !== 'cart' || items.length === 0) return null;

    const stickyStoreId = singleCheckoutStoreId;
    const stickyStoreInfo = stickyStoreId ? storeInfoById[stickyStoreId] : null;
    const stickyItems = stickyStoreId ? selectedItems.filter((item) => item.storeId === stickyStoreId) : [];
    const stickySubtotal = stickyItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const stickyShipping = stickyStoreInfo ? calcShippingFee(stickyStoreInfo, stickySubtotal) : 0;
    const stickyPayTotal = stickySubtotal + stickyShipping;
    const stickyBlocked = stickyStoreId ? isStoreCheckoutBlocked(stickyStoreId) : false;

    return (
      <footer className={`cart-page-sticky-footer${layout === 'drawer' ? ' cart-page-sticky-footer--drawer' : ''}`}>
        <div className="cart-page-sticky-summary">
          <span className="cart-page-sticky-count">{t('cart.selectedSummary', { count: selectedIds.size })}</span>
          <strong className="cart-page-sticky-total">{formatPrice(selectedSubtotal)}</strong>
        </div>
        {stickyStoreId ? (
          <>
            {stickyBlocked && <p className="cart-page-sticky-hint">{t('cart.popupEnded')}</p>}
            <button
              type="button"
              className="cart-drawer-primary-btn cart-page-sticky-btn"
              disabled={stickyItems.length === 0 || stickyBlocked}
              onClick={() => beginCheckout(stickyStoreId)}
            >
              {stickyBlocked ? t('cart.popupEndedShort') : t('cart.checkout')}
            </button>
          </>
        ) : (
          <p className="cart-page-sticky-hint">{t('cart.multiStoreCheckoutHint')}</p>
        )}
        {stickyStoreId && stickyItems.length > 0 && (
          <p className="cart-page-sticky-pay-total">
            {t('cart.payTotal')} {formatPrice(stickyPayTotal)}
          </p>
        )}
      </footer>
    );
  }

  function renderStoreFooter(forStoreId: string) {
    const groupItems = items.filter(
      (item) => item.storeId === forStoreId && selectedIds.has(item.productId),
    );
    if (groupItems.length === 0) return null;
    const info = storeInfoById[forStoreId];
    const subtotal = groupItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = info ? calcShippingFee(info, subtotal) : 0;
    const payTotal = subtotal + shipping;
    const blocked = isStoreCheckoutBlocked(forStoreId);

    return (
      <div className="cart-drawer-group-footer">
        {blocked && <p className="cart-drawer-ended-hint">{t('cart.popupEnded')}</p>}
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
        <button
          type="button"
          className="cart-drawer-primary-btn"
          disabled={blocked}
          onClick={() => beginCheckout(forStoreId)}
        >
          {blocked ? t('cart.popupEndedShort') : t('cart.checkout')}
        </button>
      </div>
    );
  }

  function renderCartItem(item: (typeof items)[number]) {
    const checked = selectedIds.has(item.productId);
    return (
      <article
        key={item.productId}
        className={`cart-drawer-item cart-drawer-item--page${!checked ? ' cart-drawer-item--unchecked' : ''}`}
      >
        <label className="cart-drawer-item-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleProduct(item.productId)}
            aria-label={item.name}
          />
        </label>
        <div className="cart-drawer-item-thumb cart-drawer-item-thumb--page">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} />
          ) : (
            <span className="cart-drawer-item-thumb-placeholder">🛍️</span>
          )}
        </div>
        <div className="cart-drawer-item-body">
          <p className="cart-drawer-item-name">{item.name}</p>
          <p className="cart-drawer-item-unit">{formatPrice(item.price)}</p>
          <div className="cart-drawer-item-footer">
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
      </article>
    );
  }

  const panel = (
    <div className={`cart-drawer-panel${isPageLayout ? ' cart-view-panel--page' : ' cart-view-panel--unified'}`}>
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
            <label className="cart-page-select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleAllProducts} />
              <span>
                {t('cart.selectAll')} ({selectedIds.size}/{items.length})
              </span>
            </label>
            {storeGroups.map((group) => {
              const storeProductIds = group.items.map((item) => item.productId);
              const storeAllSelected =
                storeProductIds.length > 0 && storeProductIds.every((id) => selectedIds.has(id));
              return (
              <section
                key={group.storeId}
                className={`cart-drawer-store-group${focusStoreId && group.storeId === focusStoreId ? ' cart-drawer-store-group--current' : ''}`}
              >
                <div className="cart-drawer-store-header">
                  <label className="cart-drawer-store-select">
                    <input
                      type="checkbox"
                      checked={storeAllSelected}
                      onChange={() => toggleStoreProducts(group.storeId)}
                      aria-label={t('cart.selectStoreAll')}
                    />
                  </label>
                  <h4 className="cart-drawer-store-name">{storeNames[group.storeId] ?? group.storeId}</h4>
                </div>
                <div className="cart-drawer-item-list">
                  {group.items.map((item) => renderCartItem(item))}
                </div>
                {!singleCheckoutStoreId && renderStoreFooter(group.storeId)}
              </section>
            );
            })}
          </>
        ))}
    </div>
  );

  if (isPageLayout) {
    return (
      <div className={`${rootClass} cart-view--page`}>
        {panel}
        {renderStickyFooter()}
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="cart-drawer-overlay" onClick={onClose}>
        <div className="cart-drawer-shell" onClick={(e) => e.stopPropagation()}>
          {panel}
          {renderStickyFooter()}
        </div>
      </div>
    </div>
  );
}
