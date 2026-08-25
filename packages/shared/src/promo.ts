/**
 * AD-028 v1b — 매장 기본 + 상품별 프로모 해석 (클라이언트·서버 `resolve_effective_promo`와 동일 규칙).
 */

export type ProductPromoMode = 'inherit' | 'none' | 'discount_only' | 'gacha_only' | 'choice';

export type StoreDefaultPromoMode = 'none' | 'discount_only' | 'gacha_only' | 'choice';

export type EffectivePromoMode = 'none' | 'discount_only' | 'gacha_only' | 'choice';

export interface ProductPromoFields {
  promo_mode: ProductPromoMode;
  promo_discount_percent: number | null;
}

export interface StorePromotionSettings {
  store_id: string;
  discount_percent: number;
  is_active: boolean;
  default_promo_mode: StoreDefaultPromoMode;
}

export interface ResolvedLinePromo {
  mode: EffectivePromoMode;
  discountPercent: number;
}

export function resolveEffectivePromo(
  product: ProductPromoFields,
  store: StorePromotionSettings | null,
): ResolvedLinePromo {
  const storeActive = store?.is_active ?? false;
  const storeMode: StoreDefaultPromoMode = storeActive
    ? (store?.default_promo_mode ?? 'choice')
    : 'none';
  const storeDiscount = storeActive ? (store?.discount_percent ?? 0) : 0;

  let mode: EffectivePromoMode;
  if (product.promo_mode === 'inherit') {
    mode = storeMode;
  } else {
    mode = product.promo_mode;
  }

  let discountPercent = 0;
  if (mode === 'discount_only' || mode === 'choice') {
    discountPercent =
      product.promo_discount_percent ?? (storeActive ? storeDiscount : 0);
    discountPercent = Math.max(0, Math.min(100, discountPercent));
    if (mode === 'discount_only' && discountPercent <= 0) {
      return { mode: 'none', discountPercent: 0 };
    }
  }

  return { mode, discountPercent };
}

export interface CheckoutBenefitPlan {
  /** 혜택 선택 단계 생략 → 바로 주문 */
  skipRewardStep: boolean;
  autoRewardType?: 'discount' | 'gacha';
  showDiscountButton: boolean;
  showGachaButton: boolean;
  preDiscountSubtotal: number;
  /** 할인 경로 선택 시 소계 (라인별 % 반영) */
  discountedSubtotal: number;
  discountAmount: number;
  hasDiscountEligible: boolean;
  hasGachaEligible: boolean;
}

export interface CheckoutLineInput {
  productId: string;
  price: number;
  quantity: number;
  promo: ProductPromoFields;
}

function roundLineTotal(amount: number): number {
  return Math.round(amount);
}

/** 장바구니(매장 단위) 혜택 UX — 손님에게 상품마다 고르게 하지 않음 */
export function planStoreCheckoutBenefit(
  lines: CheckoutLineInput[],
  store: StorePromotionSettings | null,
  hasActiveGachaPool: boolean,
): CheckoutBenefitPlan {
  let preDiscountSubtotal = 0;
  let discountedSubtotal = 0;
  let hasDiscountEligible = false;
  let hasGachaEligible = false;
  let hasChoice = false;

  for (const line of lines) {
    const { mode, discountPercent } = resolveEffectivePromo(line.promo, store);
    const linePre = line.price * line.quantity;
    preDiscountSubtotal += linePre;

    if (mode === 'discount_only' && discountPercent > 0) {
      hasDiscountEligible = true;
      discountedSubtotal += roundLineTotal(linePre * (100 - discountPercent) / 100);
    } else if (mode === 'choice') {
      hasChoice = true;
      if (discountPercent > 0) hasDiscountEligible = true;
      hasGachaEligible = true;
      discountedSubtotal += linePre;
    } else if (mode === 'gacha_only') {
      hasGachaEligible = true;
      discountedSubtotal += linePre;
    } else {
      discountedSubtotal += linePre;
    }
  }

  if (!hasActiveGachaPool) {
    hasGachaEligible = false;
  }

  let skipRewardStep = false;
  let autoRewardType: 'discount' | 'gacha' | undefined;
  let showDiscountButton = false;
  let showGachaButton = false;

  if (!hasDiscountEligible && !hasGachaEligible) {
    skipRewardStep = true;
    autoRewardType = 'gacha';
  } else if (hasDiscountEligible && !hasGachaEligible) {
    skipRewardStep = true;
    autoRewardType = 'discount';
  } else if (!hasDiscountEligible && hasGachaEligible) {
    skipRewardStep = true;
    autoRewardType = 'gacha';
  } else if (hasChoice || (hasDiscountEligible && hasGachaEligible)) {
    showDiscountButton = hasDiscountEligible;
    showGachaButton = hasGachaEligible;
  }

  if (!skipRewardStep && !showDiscountButton && !showGachaButton) {
    skipRewardStep = true;
    autoRewardType = 'gacha';
  }

  const finalDiscounted =
    autoRewardType === 'discount' ? discountedSubtotal : preDiscountSubtotal;

  return {
    skipRewardStep,
    autoRewardType,
    showDiscountButton,
    showGachaButton,
    preDiscountSubtotal,
    discountedSubtotal: finalDiscounted,
    discountAmount: preDiscountSubtotal - finalDiscounted,
    hasDiscountEligible,
    hasGachaEligible,
  };
}

/** 사용자가 「할인」 선택 시 라인별 % 합산 */
export function computeDiscountSubtotal(
  lines: CheckoutLineInput[],
  store: StorePromotionSettings | null,
): number {
  let total = 0;
  for (const line of lines) {
    const { mode, discountPercent } = resolveEffectivePromo(line.promo, store);
    const linePre = line.price * line.quantity;
    if (
      (mode === 'discount_only' || mode === 'choice') &&
      discountPercent > 0
    ) {
      total += roundLineTotal(linePre * (100 - discountPercent) / 100);
    } else {
      total += linePre;
    }
  }
  return total;
}

/** 통합 결제 — 매장 중 하나라도 선택 UI가 필요하면 reward 단계 표시 */
export function planUnifiedCheckoutBenefit(
  storePlans: CheckoutBenefitPlan[],
): {
  skipRewardStep: boolean;
  showDiscountButton: boolean;
  showGachaButton: boolean;
} {
  if (storePlans.length === 0) {
    return { skipRewardStep: true, showDiscountButton: false, showGachaButton: false };
  }

  const needsChoice = storePlans.some((p) => !p.skipRewardStep);
  if (!needsChoice) {
    return { skipRewardStep: true, showDiscountButton: false, showGachaButton: false };
  }

  return {
    skipRewardStep: false,
    showDiscountButton: storePlans.some((p) => p.showDiscountButton),
    showGachaButton: storePlans.some((p) => p.showGachaButton),
  };
}
