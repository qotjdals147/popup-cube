/** AD-069 — 보류/거절 사유 코드 (템플릿 → 손님 UI 매핑) */

export type HoldReasonCode = 'address_issue' | 'line_stock_short' | 'gacha_prize_oos' | 'other';

export type RejectReasonCode =
  | 'address_issue'
  | 'line_stock_short'
  | 'gacha_prize_oos'
  | 'policy_violation'
  | 'cannot_fulfill'
  | 'other';

export type OrderReasonKind = 'hold' | 'reject';

export interface OrderReasonTemplateOption {
  reasonCode: HoldReasonCode | RejectReasonCode;
  labelKey: string;
  /** hold 전용 — 손님 보완 UI 필요 */
  requiresAffectedItems?: boolean;
  requiresMemo?: boolean;
}

export const DEFAULT_HOLD_REASON_OPTIONS: OrderReasonTemplateOption[] = [
  { reasonCode: 'address_issue', labelKey: 'orderReasons.hold.address_issue' },
  { reasonCode: 'line_stock_short', labelKey: 'orderReasons.hold.line_stock_short', requiresAffectedItems: true },
  { reasonCode: 'gacha_prize_oos', labelKey: 'orderReasons.hold.gacha_prize_oos' },
  { reasonCode: 'other', labelKey: 'orderReasons.hold.other', requiresMemo: true },
];

export const DEFAULT_REJECT_REASON_OPTIONS: OrderReasonTemplateOption[] = [
  { reasonCode: 'line_stock_short', labelKey: 'orderReasons.reject.line_stock_short' },
  { reasonCode: 'gacha_prize_oos', labelKey: 'orderReasons.reject.gacha_prize_oos' },
  { reasonCode: 'address_issue', labelKey: 'orderReasons.reject.address_issue' },
  { reasonCode: 'policy_violation', labelKey: 'orderReasons.reject.policy_violation' },
  { reasonCode: 'cannot_fulfill', labelKey: 'orderReasons.reject.cannot_fulfill' },
  { reasonCode: 'other', labelKey: 'orderReasons.reject.other' },
];

export function holdReasonLabelKey(code: HoldReasonCode | string | null | undefined): string {
  if (!code) return '';
  return `orderReasons.hold.${code}`;
}

export function rejectReasonLabelKey(code: RejectReasonCode | string | null | undefined): string {
  if (!code) return '';
  return `orderReasons.reject.${code}`;
}

/** AD-073 R2 — 반품·교환 사유 */
export type ReturnReasonCode = 'change_of_mind' | 'defective' | 'wrong_delivery' | 'other';

export interface ReturnReasonOption {
  reasonCode: ReturnReasonCode;
  labelKey: string;
  requiresMemo?: boolean;
}

export const DEFAULT_RETURN_REASON_OPTIONS: ReturnReasonOption[] = [
  { reasonCode: 'change_of_mind', labelKey: 'orderReasons.return.change_of_mind' },
  { reasonCode: 'defective', labelKey: 'orderReasons.return.defective' },
  { reasonCode: 'wrong_delivery', labelKey: 'orderReasons.return.wrong_delivery' },
  { reasonCode: 'other', labelKey: 'orderReasons.return.other', requiresMemo: true },
];

export function returnReasonLabelKey(code: ReturnReasonCode | string | null | undefined): string {
  if (!code) return '';
  return `orderReasons.return.${code}`;
}
