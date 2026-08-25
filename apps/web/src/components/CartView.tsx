import { useEffect, useMemo, useState } from 'react';
import type {
  CheckoutBenefitPlan,
  GachaRollResult,
  ProductPromoFields,
  StorePromotion,
  StoreSummary,
  UserAddress,
} from '@popup-cube/shared';
import {
  computeDiscountSubtotal,
  computeGachaCheckoutSubtotal,
  planStoreCheckoutBenefit,
  planUnifiedCheckoutBenefit,
  resolveEffectivePromo,
} from '@popup-cube/shared';
import { useCart } from '../context/CartContext';
import { getActivePromotion, GachaError, rollGacha } from '../lib/gacha';
import { createAddress, listMyAddresses } from '../lib/addresses';
import { OrderError, placeOrder } from '../lib/orders';
import { getProductPromosByIds, getStorePromotion, shopperStoreHasGachaPool } from '../lib/promotions';
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
  if (err instanceof OrderError && err.message.includes('invalid_reward_choice')) return t('cart.invalidRewardChoice');
  if (err instanceof OrderError) return t('cart.orderSaveError');
  if (err instanceof GachaError) return t('cart.gachaError');
  return t('cart.rewardError');
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

type CartLineItem = ReturnType<typeof useCart>['items'][number];

type GachaResultWithStore = { storeId: string; storeName: string; result: GachaRollResult };

/** AD-066 mock — 매장별 place_order (서버가 라인 할인·혜택 검증) */
async function placeUnifiedStoreOrder(
  storeId: string,
  addressId: string,
  ordering: CartLineItem[],
  mode: 'discount' | 'gacha',
  shouldRollGacha: boolean,
): Promise<{ totalAmount: number; gachaResult: GachaRollResult | null }> {
  const result = await placeOrder(storeId, addressId, ordering, mode, null);
  if (mode !== 'gacha' || !shouldRollGacha) {
    return { totalAmount: result.totalAmount, gachaResult: null };
  }
  try {
    const gachaResult = await rollGacha(storeId, result.orderId);
    return { totalAmount: result.totalAmount, gachaResult };
  } catch (err) {
    if (
      err instanceof GachaError &&
      (err.message.includes('no_active_pool') || err.message.includes('empty_pool'))
    ) {
      return { totalAmount: result.totalAmount, gachaResult: null };
    }
    throw err;
  }
}

function resolveStorePlacementMode(
  plan: CheckoutBenefitPlan,
  userChoice: 'discount' | 'gacha',
): 'discount' | 'gacha' {
  if (plan.skipRewardStep) return plan.autoRewardType ?? 'gacha';
  if (userChoice === 'discount' && plan.hasDiscountEligible) return 'discount';
  if (userChoice === 'gacha' && plan.hasGachaEligible) return 'gacha';
  if (plan.hasDiscountEligible) return 'discount';
  return 'gacha';
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
  const [discountAmountSaved, setDiscountAmountSaved] = useState(0);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [gachaResult, setGachaResult] = useState<GachaRollResult | null>(null);
  const [gachaResultsByStore, setGachaResultsByStore] = useState<GachaResultWithStore[]>([]);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [storeInfoById, setStoreInfoById] = useState<Record<string, StoreSummary>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  /** 결제 성공 직후 — 해당 줄만 장바구니에서 제거 (매장 storeId 통째 삭제 방지) */
  const [lastOrderedProductIds, setLastOrderedProductIds] = useState<string[]>([]);
  /** AD-066 mock — 한 번의 결제 플로우에서 처리할 매장 목록 */
  const [checkoutStoreIds, setCheckoutStoreIds] = useState<string[]>([]);
  const [checkoutPlansByStore, setCheckoutPlansByStore] = useState<Record<string, CheckoutBenefitPlan>>({});
  const [benefitUi, setBenefitUi] = useState({
    skipRewardStep: false,
    showDiscountButton: false,
    showGachaButton: false,
  });
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [productPromoById, setProductPromoById] = useState<
    Record<string, ProductPromoFields>
  >({});
  const [storePromoById, setStorePromoById] = useState<Record<string, StorePromotion | null>>({});

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
  const checkoutTargetStoreIds = useMemo(
    () => (checkoutStoreIds.length > 0 ? checkoutStoreIds : activeStoreId ? [activeStoreId] : []),
    [checkoutStoreIds, activeStoreId],
  );

  const checkoutItems = useMemo(
    () =>
      checkoutTargetStoreIds.length > 0
        ? items.filter(
            (item) => checkoutTargetStoreIds.includes(item.storeId) && selectedIds.has(item.productId),
          )
        : [],
    [items, checkoutTargetStoreIds, selectedIds],
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

  useEffect(() => {
    const productIds = items.map((item) => item.productId);
    const storeIds = [...new Set(items.map((item) => item.storeId))];
    if (productIds.length === 0) {
      setProductPromoById({});
      setStorePromoById({});
      return;
    }
    let active = true;
    Promise.all([
      getProductPromosByIds(productIds),
      Promise.all(storeIds.map((id) => getStorePromotion(id).then((promo) => [id, promo] as const))),
    ])
      .then(([promoMap, storePairs]) => {
        if (!active) return;
        setProductPromoById(promoMap);
        setStorePromoById(Object.fromEntries(storePairs));
      })
      .catch(() => {
        if (!active) return;
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

  function beginUnifiedCheckout() {
    const eligible = storesWithSelection.filter(
      (storeId) =>
        !isStoreCheckoutBlocked(storeId) &&
        items.some((item) => item.storeId === storeId && selectedIds.has(item.productId)),
    );
    if (eligible.length === 0) return;
    setCheckoutStoreIds(eligible);
    setCheckoutStoreId(eligible[0]);
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
    setRewardError(null);
    setCheckoutBusy(true);
    void (async () => {
      try {
        const storeIds = checkoutTargetStoreIds;
        const plans: Record<string, CheckoutBenefitPlan> = {};
        for (const storeId of storeIds) {
          const ordering = items.filter(
            (item) => item.storeId === storeId && selectedIds.has(item.productId),
          );
          if (ordering.length === 0) continue;
          const productIds = ordering.map((item) => item.productId);
          const [promoMap, storePromo, hasPool] = await Promise.all([
            getProductPromosByIds(productIds),
            getActivePromotion(storeId),
            shopperStoreHasGachaPool(storeId),
          ]);
          const lines = ordering.map((item) => ({
            productId: item.productId,
            price: item.price,
            quantity: item.quantity,
            promo: promoMap[item.productId] ?? {
              promo_mode: 'inherit' as const,
              promo_discount_percent: null,
            },
          }));
          plans[storeId] = planStoreCheckoutBenefit(lines, storePromo, hasPool);
        }
        setCheckoutPlansByStore(plans);
        const unified = planUnifiedCheckoutBenefit(Object.values(plans));
        setBenefitUi(unified);

        if (unified.skipRewardStep) {
          await executeCheckout(plans);
        } else {
          setPhase('reward');
        }
      } catch (err) {
        setAddressError(orderErrorMessage(err));
      } finally {
        setCheckoutBusy(false);
      }
    })();
  }

  async function executeCheckout(
    plans: Record<string, CheckoutBenefitPlan>,
    userChoice?: 'discount' | 'gacha',
  ) {
    if (checkoutTargetStoreIds.length === 0 || !selectedAddressId) return;
    setRewardError(null);
    setCheckoutBusy(true);
    if (userChoice === 'gacha') setPhase('gachaRolling');
    const rollingStarted = userChoice === 'gacha' ? Date.now() : 0;
    try {
      let totalAmount = 0;
      let preSubtotal = 0;
      let discountSubtotal = 0;
      const orderedProductIds: string[] = [];
      const rolledGacha: GachaResultWithStore[] = [];
      let lastGacha: GachaRollResult | null = null;
      let anyGachaRollAttempted = false;

      for (const storeId of checkoutTargetStoreIds) {
        const ordering = items.filter(
          (item) => item.storeId === storeId && selectedIds.has(item.productId),
        );
        if (ordering.length === 0) continue;
        const plan = plans[storeId];
        const mode = userChoice
          ? resolveStorePlacementMode(plan, userChoice)
          : (plan?.autoRewardType ?? 'gacha');
        const shouldRollGacha = mode === 'gacha' && (plan?.hasGachaEligible ?? false);
        if (shouldRollGacha) anyGachaRollAttempted = true;

        const { totalAmount: storeTotal, gachaResult: storeGacha } = await placeUnifiedStoreOrder(
          storeId,
          selectedAddressId,
          ordering,
          mode,
          shouldRollGacha,
        );
        orderedProductIds.push(...ordering.map((item) => item.productId));
        totalAmount += storeTotal;
        const storePre =
          plan?.preDiscountSubtotal ?? ordering.reduce((s, i) => s + i.price * i.quantity, 0);
        preSubtotal += storePre;

        if (mode === 'discount') {
          const productIds = ordering.map((i) => i.productId);
          const promoMap = await getProductPromosByIds(productIds);
          const storePromo = await getActivePromotion(storeId);
          const lines = ordering.map((item) => ({
            productId: item.productId,
            price: item.price,
            quantity: item.quantity,
            promo: promoMap[item.productId] ?? { promo_mode: 'inherit', promo_discount_percent: null },
          }));
          discountSubtotal += computeDiscountSubtotal(lines, storePromo);
        } else {
          const productIds = ordering.map((i) => i.productId);
          const promoMap = await getProductPromosByIds(productIds);
          const storePromo = await getActivePromotion(storeId);
          const lines = ordering.map((item) => ({
            productId: item.productId,
            price: item.price,
            quantity: item.quantity,
            promo: promoMap[item.productId] ?? { promo_mode: 'inherit', promo_discount_percent: null },
          }));
          discountSubtotal += computeGachaCheckoutSubtotal(lines, storePromo);
        }
        if (storeGacha) {
          lastGacha = storeGacha;
          rolledGacha.push({
            storeId,
            storeName: storeNames[storeId] ?? storeId,
            result: storeGacha,
          });
        }
      }

      if (rollingStarted > 0) {
        const elapsed = Date.now() - rollingStarted;
        if (elapsed < 900) {
          await new Promise((resolve) => setTimeout(resolve, 900 - elapsed));
        }
      }

      setLastOrderedProductIds(orderedProductIds);
      setFinalTotal(totalAmount);
      setGachaResultsByStore(rolledGacha);

      const choseGacha = userChoice === 'gacha' || (!userChoice && anyGachaRollAttempted);
      if (choseGacha) {
        setGachaResult(lastGacha);
        setPhase('gachaResult');
      } else {
        const saved = Math.max(0, preSubtotal - discountSubtotal);
        setDiscountAmountSaved(saved);
        setDiscountPercent(saved > 0 && preSubtotal > 0 ? Math.round((saved / preSubtotal) * 100) : 0);
        setPhase('discountResult');
      }
    } catch (err) {
      setRewardError(orderErrorMessage(err));
      if (userChoice) setPhase('reward');
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function handleChooseDiscount() {
    await executeCheckout(checkoutPlansByStore, 'discount');
  }

  async function handleChooseGacha() {
    await executeCheckout(checkoutPlansByStore, 'gacha');
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
    setCheckoutStoreIds([]);
    setDiscountPercent(null);
    setDiscountAmountSaved(0);
    setFinalTotal(null);
    setGachaResult(null);
    setGachaResultsByStore([]);
    setSelectedAddressId(null);
    setAddresses([]);
    if (layout === 'drawer') onClose?.();
  }

  const discountAmount = discountAmountSaved;
  const addressAppearance = appearance === 'light' ? 'light' : 'dark';

  function renderStickyFooter() {
    if (phase !== 'cart' || items.length === 0) return null;

    const eligibleStores = storesWithSelection.filter((storeId) => !isStoreCheckoutBlocked(storeId));
    const stickyPayTotal = storesWithSelection.reduce((sum, storeId) => {
      const storeItems = selectedItems.filter((item) => item.storeId === storeId);
      if (storeItems.length === 0) return sum;
      const subtotal = storeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const info = storeInfoById[storeId];
      return sum + subtotal + (info ? calcShippingFee(info, subtotal) : 0);
    }, 0);
    const stickyBlocked = selectedItems.length > 0 && eligibleStores.length === 0;

    return (
      <footer className={`cart-page-sticky-footer${layout === 'drawer' ? ' cart-page-sticky-footer--drawer' : ''}`}>
        <div className="cart-page-sticky-summary">
          <span className="cart-page-sticky-count">{t('cart.selectedSummary', { count: selectedIds.size })}</span>
          <strong className="cart-page-sticky-total">{formatPrice(selectedSubtotal)}</strong>
        </div>
        {stickyBlocked && <p className="cart-page-sticky-hint">{t('cart.popupEnded')}</p>}
        <button
          type="button"
          className="cart-drawer-primary-btn cart-page-sticky-btn"
          disabled={selectedItems.length === 0 || stickyBlocked}
          onClick={() => beginUnifiedCheckout()}
        >
          {stickyBlocked ? t('cart.popupEndedShort') : t('cart.checkout')}
        </button>
        {selectedItems.length > 0 && (
          <p className="cart-page-sticky-pay-total">
            {t('cart.payTotal')} {formatPrice(stickyPayTotal)}
          </p>
        )}
      </footer>
    );
  }

  function renderCartItem(item: (typeof items)[number]) {
    const checked = selectedIds.has(item.productId);
    const productPromo = productPromoById[item.productId] ?? {
      promo_mode: 'inherit' as const,
      promo_discount_percent: null,
    };
    const storePromo = storePromoById[item.storeId] ?? null;
    const resolved = resolveEffectivePromo(productPromo, storePromo);
    const hasLineDiscount =
      resolved.mode === 'discount_only' && resolved.discountPercent > 0;
    const unitDiscounted = hasLineDiscount
      ? Math.round(item.price * (100 - resolved.discountPercent) / 100)
      : null;

    let promoBadge: string | null = null;
    let promoBadgeKind: 'discount' | 'gacha' | 'choice' | 'none' = 'none';
    if (resolved.mode === 'discount_only' && resolved.discountPercent > 0) {
      promoBadge = t('cart.linePromoDiscount', { percent: resolved.discountPercent });
      promoBadgeKind = 'discount';
    } else if (resolved.mode === 'gacha_only') {
      promoBadge = t('cart.linePromoGacha');
      promoBadgeKind = 'gacha';
    } else if (resolved.mode === 'choice') {
      promoBadge = t('cart.linePromoChoice');
      promoBadgeKind = 'choice';
    } else if (resolved.mode === 'none') {
      promoBadge = t('cart.linePromoNone');
      promoBadgeKind = 'none';
    }

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
          <div className="cart-drawer-item-top">
            <p className="cart-drawer-item-name">{item.name}</p>
            <button
              type="button"
              className="cart-drawer-remove-x"
              onClick={() => removeItem(item.productId)}
              aria-label={t('cart.removeItem')}
            >
              ✕
            </button>
          </div>
          {promoBadge && (
            <span className={`cart-line-promo-badge cart-line-promo-badge--${promoBadgeKind}`}>
              {promoBadge}
            </span>
          )}
          {hasLineDiscount && unitDiscounted !== null ? (
            <p className="cart-drawer-item-unit cart-drawer-item-unit--discounted">
              <span className="cart-drawer-item-unit-original">{formatPrice(item.price)}</span>
              <span className="cart-drawer-item-unit-sale">{formatPrice(unitDiscounted)}</span>
            </p>
          ) : (
            <p className="cart-drawer-item-unit">{formatPrice(item.price)}</p>
          )}
          <div className="cart-drawer-item-footer">
            <div className="cart-drawer-item-qty-col">
              <div className="cart-drawer-stepper">
                <button type="button" className="cart-drawer-qty-btn" onClick={() => decrementQuantity(item.productId)}>
                  −
                </button>
                <span className="cart-drawer-qty-value">{item.quantity}</span>
                <button type="button" className="cart-drawer-qty-btn" onClick={() => incrementQuantity(item.productId)}>
                  +
                </button>
              </div>
              <p className="cart-drawer-line-total-row">
                {hasLineDiscount && unitDiscounted !== null
                  ? formatPrice(unitDiscounted * item.quantity)
                  : formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
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
            <button
              type="button"
              className="cart-drawer-primary-btn"
              style={{ marginTop: 14 }}
              disabled={checkoutBusy}
              onClick={handleContinueToReward}
            >
              {checkoutBusy ? t('cart.checkoutProcessing') : t('cart.addressContinue')}
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
            {benefitUi.showDiscountButton && (
              <button
                type="button"
                className="cart-drawer-reward-btn"
                disabled={checkoutBusy}
                onClick={() => void handleChooseDiscount()}
              >
                💸 {t('cart.chooseDiscount')}
              </button>
            )}
            {benefitUi.showGachaButton && (
              <button
                type="button"
                className="cart-drawer-reward-btn"
                disabled={checkoutBusy}
                onClick={() => void handleChooseGacha()}
              >
                🎰 {t('cart.chooseGacha')}
              </button>
            )}
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

      {phase === 'gachaResult' && (
        <div className="cart-drawer-complete">
          {gachaResultsByStore.length > 0 ? (
            <>
              <div className="cart-drawer-complete-icon">🎉</div>
              <p className="cart-drawer-complete-text">{t('cart.gachaWonTitle')}</p>
              {gachaResultsByStore.map(({ storeId, storeName, result }) => {
                const label = result.product_name ?? result.exclusive_name ?? '';
                const image = result.product_image_url ?? result.exclusive_image_url ?? null;
                const isProduct = !!result.product_id;
                return (
                  <div key={storeId} style={{ marginBottom: 16 }}>
                    <p className="cart-drawer-step-hint">{t('cart.gachaStoreLabel', { store: storeName })}</p>
                    {image ? (
                      <img src={image} alt={label} style={{ width: 96, height: 96, objectFit: 'contain' }} />
                    ) : null}
                    <p className="cart-drawer-complete-text" style={{ color: '#e94560' }}>
                      {label}
                    </p>
                    <span className="cart-drawer-gacha-type">
                      {isProduct ? t('cart.gachaBadgeProduct') : t('cart.gachaBadgeExclusive')}
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <div className="cart-drawer-complete-icon">✅</div>
              <p className="cart-drawer-complete-text">{t('cart.gachaNoPrizeTitle')}</p>
              <p className="cart-drawer-step-hint">{t('cart.gachaNoPrizeHint')}</p>
            </>
          )}
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
