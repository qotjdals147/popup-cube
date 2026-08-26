import type { CartItem, Order, OwnerOrderView, OrderStatus, RewardType, ShopperOrderView } from '@popup-cube/shared';

import { supabase } from './supabase';
import { formatOrderRef } from './orderRef';



export class OrderError extends Error {}



export interface PlaceOrderResult {
  orderId: string;
  totalAmount: number;
  subtotalAmount: number;
  shippingFee: number;
  orderNumber: number;
  storeCode: string;
  orderRef: string;
}



export async function placeOrder(

  storeId: string,

  addressId: string | null,

  items: CartItem[],

  rewardType: RewardType,

  discountPercent: number | null

): Promise<PlaceOrderResult> {

  const payloadItems = items

    .filter((item) => item.storeId === storeId)

    .map((item) => ({ product_id: item.productId, quantity: item.quantity }));



  if (payloadItems.length === 0) {

    throw new OrderError('no_items_for_store');

  }



  const { data, error } = await supabase.rpc('place_order', {

    p_store_id: storeId,

    p_address_id: addressId,

    p_items: payloadItems,

    p_reward_type: rewardType,

    p_discount_percent: discountPercent,

  });



  if (error) {

    if (error.message.includes('insufficient_stock')) throw new OrderError('insufficient_stock');
    if (error.message.includes('popup_ended')) throw new OrderError('popup_ended');

    throw new OrderError(error.message);

  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) throw new OrderError('empty_result');

  const orderNumber = Number(result.order_number);

  const storeCode = String(result.store_code ?? '');

  return {
    orderId: result.order_id,
    totalAmount: result.total_amount,
    subtotalAmount: Number(result.subtotal_amount ?? result.total_amount),
    shippingFee: Number(result.shipping_fee ?? 0),
    orderNumber,
    storeCode,
    orderRef: formatOrderRef(storeCode, orderNumber),
  };

}



interface StoreOrderRow {

  order_id: string;

  order_number: number;

  store_code: string;

  total_amount: number;
  subtotal_amount: number;
  shipping_fee: number;
  discount_percent: number | null;

  reward_type: 'discount' | 'gacha';

  status: OrderStatus;

  auto_accepted: boolean;

  accepted_at: string | null;

  tracking_number: string | null;

  shipped_at: string | null;

  delivery_completed_at: string | null;

  purchase_confirmed_at: string | null;

  purchase_confirm_auto: boolean;

  cancelled_at: string | null;

  cancelled_by: 'owner' | 'shopper' | null;

  claim_status: 'none' | 'open' | 'resolved';

  claim_message: string | null;

  claim_reply: string | null;

  claim_created_at: string | null;

  claim_resolved_at: string | null;

  hold_reason_code: string | null;
  hold_reason_text: string | null;
  hold_requested_at: string | null;
  hold_affected_item_ids: string[] | null;
  supplement_submitted_at: string | null;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  shipping_address_id: string | null;

  created_at: string;

  buyer_nickname: string | null;

  shipping_label: string | null;

  shipping_recipient_name: string | null;

  shipping_phone: string | null;

  shipping_postal_code: string | null;

  shipping_address_line1: string | null;

  shipping_address_line2: string | null;

  item_id: string;

  product_id: string;

  product_name: string;

  quantity: number;

  unit_price: number;

  gacha_product_name: string | null;

  gacha_exclusive_name: string | null;

  gacha_product_image_url: string | null;

  gacha_exclusive_image_url: string | null;

}



export async function listStoreOrders(storeId: string): Promise<OwnerOrderView[]> {

  const { data, error } = await supabase.rpc('get_store_orders', { p_store_id: storeId });

  if (error) throw new OrderError(error.message);



  const rows = (data ?? []) as StoreOrderRow[];

  const byOrder = new Map<string, OwnerOrderView>();



  for (const row of rows) {

    let order = byOrder.get(row.order_id);

    if (!order) {

      const prizeName = row.gacha_product_name ?? row.gacha_exclusive_name;

      const prizeImage = row.gacha_product_image_url ?? row.gacha_exclusive_image_url;

      order = {

        id: row.order_id,

        store_id: storeId,

        order_number: row.order_number,

        store_code: row.store_code,

        user_id: '',

        subtotal_amount: row.subtotal_amount,

        shipping_fee: row.shipping_fee,

        total_amount: row.total_amount,

        discount_percent: row.discount_percent,

        reward_type: row.reward_type,

        status: row.status,

        auto_accepted: row.auto_accepted,

        accepted_at: row.accepted_at,

        tracking_number: row.tracking_number,

        shipped_at: row.shipped_at,

        delivery_completed_at: row.delivery_completed_at,

        purchase_confirmed_at: row.purchase_confirmed_at,

        purchase_confirm_auto: row.purchase_confirm_auto,

        cancelled_at: row.cancelled_at,

        cancelled_by: row.cancelled_by,

        claim_status: row.claim_status,

        claim_message: row.claim_message,

        claim_reply: row.claim_reply,

        claim_created_at: row.claim_created_at,

        claim_resolved_at: row.claim_resolved_at,

        hold_reason_code: row.hold_reason_code,
        hold_reason_text: row.hold_reason_text,
        hold_requested_at: row.hold_requested_at,
        hold_affected_item_ids: row.hold_affected_item_ids,
        supplement_submitted_at: row.supplement_submitted_at,
        reject_reason_code: row.reject_reason_code,
        reject_reason_text: row.reject_reason_text,
        shipping_address_id: row.shipping_address_id,

        created_at: row.created_at,

        buyer_nickname: row.buyer_nickname,

        shipping_label: row.shipping_label,

        shipping_recipient_name: row.shipping_recipient_name,

        shipping_phone: row.shipping_phone,

        shipping_postal_code: row.shipping_postal_code,

        shipping_address_line1: row.shipping_address_line1,

        shipping_address_line2: row.shipping_address_line2,

        gacha_prize_name: prizeName,

        gacha_prize_image_url: prizeImage,

        gacha_prize_is_product: Boolean(row.gacha_product_name),

        items: [],

      };

      byOrder.set(row.order_id, order);

    }

    order.items.push({

      id: row.item_id,

      product_id: row.product_id,

      product_name: row.product_name,

      quantity: row.quantity,

      unit_price: row.unit_price,

    });

  }



  return Array.from(byOrder.values());

}



export async function acceptOrder(orderId: string): Promise<void> {

  const { error } = await supabase.rpc('accept_order', { p_order_id: orderId });

  if (error) throw new OrderError(error.message);

}



export async function rejectOrder(
  orderId: string,
  reasonCode?: string | null,
  reasonMemo?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('reject_order', {
    p_order_id: orderId,
    p_reason_code: reasonCode ?? null,
    p_reason_memo: reasonMemo ?? null,
  });
  if (error) throw new OrderError(error.message);
}

/** AD-069 — 점주: 주문 보류(보완 요청) */
export async function holdOrder(
  orderId: string,
  reasonCode: string,
  reasonMemo?: string | null,
  affectedItemIds?: string[] | null,
): Promise<void> {
  const { error } = await supabase.rpc('hold_order', {
    p_order_id: orderId,
    p_reason_code: reasonCode,
    p_reason_memo: reasonMemo ?? null,
    p_affected_item_ids: affectedItemIds?.length ? affectedItemIds : null,
  });
  if (error) throw new OrderError(error.message);
}

export interface SubmitSupplementResult {
  needsGachaRoll: boolean;
}

/** AD-069 — 손님: 보류 주문 보완 제출 */
export async function submitOrderSupplement(
  orderId: string,
  payload: Record<string, unknown>,
): Promise<SubmitSupplementResult> {
  const { data, error } = await supabase.rpc('submit_order_supplement', {
    p_order_id: orderId,
    p_payload: payload,
  });
  if (error) throw new OrderError(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { needsGachaRoll: Boolean(row?.needs_gacha_roll) };
}

export interface StoreReasonTemplateRow {
  id: string;
  reason_code: string;
  label: string;
  sort_order: number;
}

export async function listStoreReasonTemplates(
  storeId: string,
  kind: 'hold' | 'reject',
): Promise<StoreReasonTemplateRow[]> {
  const { data, error } = await supabase.rpc('list_store_reason_templates', {
    p_store_id: storeId,
    p_kind: kind,
  });
  if (error) throw new OrderError(error.message);
  return (data ?? []) as StoreReasonTemplateRow[];
}

export async function upsertStoreReasonTemplate(
  storeId: string,
  kind: 'hold' | 'reject',
  reasonCode: string,
  label: string,
  templateId?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('upsert_store_reason_template', {
    p_store_id: storeId,
    p_kind: kind,
    p_reason_code: reasonCode,
    p_label: label,
    p_template_id: templateId ?? null,
  });
  if (error) throw new OrderError(error.message);
}

export async function deleteStoreReasonTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_store_reason_template', {
    p_template_id: templateId,
  });
  if (error) throw new OrderError(error.message);
}

export async function registerPushToken(expoPushToken: string): Promise<void> {
  const { error } = await supabase.rpc('register_push_token', {
    p_expo_push_token: expoPushToken,
  });
  if (error) throw new OrderError(error.message);
}



export async function shipOrder(orderId: string, trackingNumber: string | null): Promise<void> {

  const { error } = await supabase.rpc('ship_order', {

    p_order_id: orderId,

    p_tracking_number: trackingNumber?.trim() || null,

  });

  if (error) throw new OrderError(error.message);

}



/** AD-054 — 점주: 배송 시작(shipped) → 배송 완료 */
export async function completeDelivery(orderId: string): Promise<void> {

  const { error } = await supabase.rpc('complete_delivery', { p_order_id: orderId });

  if (error) throw new OrderError(error.message);

}



/** AD-054 — 손님: 수동 구매확정 */
export async function confirmPurchase(orderId: string): Promise<void> {

  const { error } = await supabase.rpc('confirm_purchase', { p_order_id: orderId });

  if (error) throw new OrderError(error.message);

}



/** §53 P0#8 — 손님: 발송 전(수락 대기·수락됨) 주문 직접 취소 */
export async function cancelOrderByShopper(orderId: string): Promise<void> {

  const { error } = await supabase.rpc('cancel_order_by_shopper', { p_order_id: orderId });

  if (error) throw new OrderError(error.message);

}



/** §53 P0#8 — 손님: 배송중~구매확정 주문에 문의(클레임) 등록 */
export async function createOrderClaim(orderId: string, message: string): Promise<void> {

  const { error } = await supabase.rpc('create_order_claim', {
    p_order_id: orderId,
    p_message: message,
  });

  if (error) throw new OrderError(error.message);

}



/** §53 P0#8 — 점주: 접수된 클레임에 답변 → 종료 */
export async function resolveOrderClaim(orderId: string, reply: string): Promise<void> {

  const { error } = await supabase.rpc('resolve_order_claim', {
    p_order_id: orderId,
    p_reply: reply,
  });

  if (error) throw new OrderError(error.message);

}



export function isOnHoldOrderStatus(status: OrderStatus): boolean {
  return status === 'on_hold';
}

export function isPendingOrderStatus(status: OrderStatus): boolean {

  return status === 'awaiting_accept' || status === 'pending' || status === 'paid';

}



export function isFulfillmentOrderStatus(status: OrderStatus): boolean {

  return (

    status === 'accepted' ||

    status === 'shipped' ||

    status === 'delivery_completed' ||

    status === 'purchase_confirmed' ||

    status === 'completed' ||

    status === 'cancelled'

  );

}



/** AD-054 — 손님이 지금 「구매확정」을 누를 수 있는 상태인지 */
export function canConfirmPurchase(status: OrderStatus): boolean {

  return status === 'shipped' || status === 'delivery_completed';

}



/** §53 P0#8 — 손님이 지금 주문을 직접 취소할 수 있는 상태인지 (발송 전) */
export function isCancellableByShopper(status: OrderStatus): boolean {

  return status === 'awaiting_accept' || status === 'accepted' || status === 'on_hold';

}



/** §53 P0#8 — 손님이 지금 문의(클레임)를 남길 수 있는 상태인지 (배송중~구매확정) */
export function canFileClaim(status: OrderStatus): boolean {
  return (
    status === 'shipped' ||
    status === 'delivery_completed' ||
    status === 'purchase_confirmed' ||
    status === 'completed'
  );
}

/** §54 — 리뷰 버튼 노출 (구매·배송 완료 후 · 미구매자/결제만=버튼 없음) */
export function canShowReviewButton(status: OrderStatus): boolean {
  return canFileClaim(status);
}

/** 주문 라인 단가×수량 합 (할인 전) */
export function sumOrderItemsSubtotal(items: { unit_price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}

/** 가챠/할인 혜택으로 깎인 금액 (없으면 0) */
export function orderDiscountAmount(
  order: Pick<Order, 'reward_type' | 'discount_percent' | 'subtotal_amount'> & {
    items: { unit_price: number; quantity: number }[];
  },
): number {
  if (order.reward_type !== 'discount' || !order.discount_percent) return 0;
  const before = sumOrderItemsSubtotal(order.items);
  const after = order.subtotal_amount ?? before;
  return Math.max(0, before - after);
}

/** 배송·확정 타임라인 칩을 보여줄지 (타임스탬프 또는 배송 이후 상태) */
export function orderHasDeliveryTimeline(order: Pick<Order, 'status' | 'shipped_at' | 'delivery_completed_at' | 'purchase_confirmed_at'>): boolean {
  if (order.shipped_at || order.delivery_completed_at || order.purchase_confirmed_at) return true;
  return (
    order.status === 'shipped' ||
    order.status === 'delivery_completed' ||
    order.status === 'purchase_confirmed' ||
    order.status === 'completed'
  );
}

export interface StoreOrderCounts {

  pendingAccept: number;

  awaitingShip: number;

  onHold: number;

}



interface MyOrderRow {

  order_id: string;

  order_number: number;

  store_id: string;

  store_code: string | null;

  store_name: string | null;

  total_amount: number;
  subtotal_amount: number;
  shipping_fee: number;
  discount_percent: number | null;

  reward_type: 'discount' | 'gacha';

  status: OrderStatus;

  auto_accepted: boolean;

  accepted_at: string | null;

  tracking_number: string | null;

  shipped_at: string | null;

  delivery_completed_at: string | null;

  purchase_confirmed_at: string | null;

  purchase_confirm_auto: boolean;

  cancelled_at: string | null;

  cancelled_by: 'owner' | 'shopper' | null;

  claim_status: 'none' | 'open' | 'resolved';

  claim_message: string | null;

  claim_reply: string | null;

  claim_created_at: string | null;

  claim_resolved_at: string | null;

  hold_reason_code: string | null;
  hold_reason_text: string | null;
  hold_requested_at: string | null;
  hold_affected_item_ids: string[] | null;
  supplement_submitted_at: string | null;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  shipping_address_id: string | null;

  created_at: string;

  shipping_recipient_name: string | null;

  shipping_phone: string | null;

  shipping_postal_code: string | null;

  shipping_address_line1: string | null;

  shipping_address_line2: string | null;

  item_id: string;

  product_id: string;

  product_name: string;

  product_image_url: string | null;

  quantity: number;

  unit_price: number;

  gacha_product_name: string | null;

  gacha_exclusive_name: string | null;

  gacha_product_image_url: string | null;

  gacha_exclusive_image_url: string | null;

}



/** AD-054 — 손님 「내 주문」 목록 (매장 무관, 로그인 본인 주문 전체) */
export async function listMyOrders(): Promise<ShopperOrderView[]> {

  const { data, error } = await supabase.rpc('get_my_orders');

  if (error) throw new OrderError(error.message);



  const rows = (data ?? []) as MyOrderRow[];

  const byOrder = new Map<string, ShopperOrderView>();



  for (const row of rows) {

    let order = byOrder.get(row.order_id);

    if (!order) {

      const prizeName = row.gacha_product_name ?? row.gacha_exclusive_name;

      const prizeImage = row.gacha_product_image_url ?? row.gacha_exclusive_image_url;

      order = {

        id: row.order_id,

        store_id: row.store_id,

        order_number: row.order_number,

        store_code: row.store_code,

        store_name: row.store_name,

        user_id: '',

        subtotal_amount: row.subtotal_amount,

        shipping_fee: row.shipping_fee,

        total_amount: row.total_amount,

        discount_percent: row.discount_percent,

        reward_type: row.reward_type,

        status: row.status,

        auto_accepted: row.auto_accepted,

        accepted_at: row.accepted_at,

        tracking_number: row.tracking_number,

        shipped_at: row.shipped_at,

        delivery_completed_at: row.delivery_completed_at,

        purchase_confirmed_at: row.purchase_confirmed_at,

        purchase_confirm_auto: row.purchase_confirm_auto,

        cancelled_at: row.cancelled_at,

        cancelled_by: row.cancelled_by,

        claim_status: row.claim_status,

        claim_message: row.claim_message,

        claim_reply: row.claim_reply,

        claim_created_at: row.claim_created_at,

        claim_resolved_at: row.claim_resolved_at,

        hold_reason_code: row.hold_reason_code,
        hold_reason_text: row.hold_reason_text,
        hold_requested_at: row.hold_requested_at,
        hold_affected_item_ids: row.hold_affected_item_ids,
        supplement_submitted_at: row.supplement_submitted_at,
        reject_reason_code: row.reject_reason_code,
        reject_reason_text: row.reject_reason_text,
        shipping_address_id: row.shipping_address_id,

        created_at: row.created_at,

        shipping_recipient_name: row.shipping_recipient_name,

        shipping_phone: row.shipping_phone,

        shipping_postal_code: row.shipping_postal_code,

        shipping_address_line1: row.shipping_address_line1,

        shipping_address_line2: row.shipping_address_line2,

        gacha_prize_name: prizeName,

        gacha_prize_image_url: prizeImage,

        gacha_prize_is_product: Boolean(row.gacha_product_name),

        items: [],

      };

      byOrder.set(row.order_id, order);

    }

    order.items.push({

      id: row.item_id,

      product_id: row.product_id,

      product_name: row.product_name,

      product_image_url: row.product_image_url,

      quantity: row.quantity,

      unit_price: row.unit_price,

    });

  }



  return Array.from(byOrder.values());

}



/** AD-055 — 사이드바 뱃지용 가벼운 집계 */
export async function getStoreOrderCounts(storeId: string): Promise<StoreOrderCounts> {

  const { data, error } = await supabase.rpc('get_store_order_counts', { p_store_id: storeId });

  if (error) throw new OrderError(error.message);

  const row = Array.isArray(data) ? data[0] : data;

  return {

    pendingAccept: Number(row?.pending_accept ?? 0),

    awaitingShip: Number(row?.awaiting_ship ?? 0),

    onHold: Number(row?.on_hold ?? 0),

  };

}


