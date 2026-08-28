import type { StorePolicy, StoreShippingFeeType } from '@popup-cube/shared';

/** 할인 적용 후 상품합 기준 배송비 (서버 calc_store_shipping_fee와 동일) */
export function calcShippingFee(
  policy: Pick<StorePolicy, 'shipping_fee_type' | 'shipping_fee_amount' | 'shipping_free_threshold'>,
  subtotalAfterDiscount: number
): number {
  const subtotal = Math.max(0, subtotalAfterDiscount);
  switch (policy.shipping_fee_type) {
    case 'free':
      return 0;
    case 'flat':
      return Math.max(0, policy.shipping_fee_amount);
    case 'conditional_free':
      return subtotal >= Math.max(0, policy.shipping_free_threshold)
        ? 0
        : Math.max(0, policy.shipping_fee_amount);
    default:
      return 0;
  }
}

export function normalizeShippingFeeType(value: string): StoreShippingFeeType {
  if (value === 'flat' || value === 'conditional_free') return value;
  return 'free';
}

export const DEFAULT_STORE_POLICY: StorePolicy = {
  cs_phone: null,
  cs_email: null,
  return_recipient_name: null,
  return_phone: null,
  return_postal_code: null,
  return_address_line1: null,
  return_address_line2: null,
  shipping_guide: null,
  exchange_return_guide: null,
  return_change_of_mind_allowed: true,
  return_change_of_mind_days: 7,
  exchange_allowed: true,
  shipping_fee_type: 'free',
  shipping_fee_amount: 0,
  shipping_free_threshold: 0,
};

export const STORE_POLICY_SELECT =
  'cs_phone, cs_email, return_recipient_name, return_phone, return_postal_code, return_address_line1, return_address_line2, shipping_guide, exchange_return_guide, return_change_of_mind_allowed, return_change_of_mind_days, exchange_allowed, shipping_fee_type, shipping_fee_amount, shipping_free_threshold';

export function mapStorePolicyRow(row: Record<string, unknown> | null | undefined): StorePolicy {
  if (!row) return { ...DEFAULT_STORE_POLICY };
  return {
    cs_phone: (row.cs_phone as string | null) ?? null,
    cs_email: (row.cs_email as string | null) ?? null,
    return_recipient_name: (row.return_recipient_name as string | null) ?? null,
    return_phone: (row.return_phone as string | null) ?? null,
    return_postal_code: (row.return_postal_code as string | null) ?? null,
    return_address_line1: (row.return_address_line1 as string | null) ?? null,
    return_address_line2: (row.return_address_line2 as string | null) ?? null,
    shipping_guide: (row.shipping_guide as string | null) ?? null,
    exchange_return_guide: (row.exchange_return_guide as string | null) ?? null,
    return_change_of_mind_allowed: row.return_change_of_mind_allowed !== false,
    return_change_of_mind_days: Number(row.return_change_of_mind_days ?? 7),
    exchange_allowed: row.exchange_allowed !== false,
    shipping_fee_type: normalizeShippingFeeType(String(row.shipping_fee_type ?? 'free')),
    shipping_fee_amount: Number(row.shipping_fee_amount ?? 0),
    shipping_free_threshold: Number(row.shipping_free_threshold ?? 0),
  };
}
