import type { CartItem, OwnerOrderView, RewardType } from '@popup-cube/shared';
import { supabase } from './supabase';

export class OrderError extends Error {}

export interface PlaceOrderResult {
  orderId: string;
  totalAmount: number;
}

/**
 * 결제(mock) 확정 — 서버 함수(`place_order`)가 실제 상품 가격을 다시 읽어서 계산하고
 * (클라이언트가 보낸 가격은 신뢰하지 않음), 할인은 실제 활성 프로모션과 일치하는지 검증한 뒤
 * `orders`/`order_items`에 원자적으로 저장한다.
 */
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

  if (error) throw new OrderError(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) throw new OrderError('empty_result');
  return { orderId: result.order_id, totalAmount: result.total_amount };
}

interface StoreOrderRow {
  order_id: string;
  total_amount: number;
  discount_percent: number | null;
  reward_type: 'discount' | 'gacha';
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
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
}

/**
 * 점주용 — 본인 매장 주문 전체 조회 (`get_store_orders` SECURITY DEFINER 함수 — 구매자
 * 닉네임·배송지는 본인 매장 주문에 한해서만 볼 수 있게 서버에서 소유권 검증 후 반환).
 */
export async function listStoreOrders(storeId: string): Promise<OwnerOrderView[]> {
  const { data, error } = await supabase.rpc('get_store_orders', { p_store_id: storeId });
  if (error) throw new OrderError(error.message);

  const rows = (data ?? []) as StoreOrderRow[];
  const byOrder = new Map<string, OwnerOrderView>();

  for (const row of rows) {
    let order = byOrder.get(row.order_id);
    if (!order) {
      order = {
        id: row.order_id,
        store_id: storeId,
        user_id: '',
        shipping_address_id: null,
        total_amount: row.total_amount,
        discount_percent: row.discount_percent,
        reward_type: row.reward_type,
        status: row.status,
        created_at: row.created_at,
        buyer_nickname: row.buyer_nickname,
        shipping_label: row.shipping_label,
        shipping_recipient_name: row.shipping_recipient_name,
        shipping_phone: row.shipping_phone,
        shipping_postal_code: row.shipping_postal_code,
        shipping_address_line1: row.shipping_address_line1,
        shipping_address_line2: row.shipping_address_line2,
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
