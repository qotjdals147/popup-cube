import type { CartItem, OwnerOrderView, OrderStatus, RewardType } from '@popup-cube/shared';

import { supabase } from './supabase';



export class OrderError extends Error {}



export interface PlaceOrderResult {

  orderId: string;

  totalAmount: number;

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

    throw new OrderError(error.message);

  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) throw new OrderError('empty_result');

  return { orderId: result.order_id, totalAmount: result.total_amount };

}



interface StoreOrderRow {

  order_id: string;

  total_amount: number;

  discount_percent: number | null;

  reward_type: 'discount' | 'gacha';

  status: OrderStatus;

  auto_accepted: boolean;

  accepted_at: string | null;

  tracking_number: string | null;

  shipped_at: string | null;

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

        user_id: '',

        shipping_address_id: null,

        total_amount: row.total_amount,

        discount_percent: row.discount_percent,

        reward_type: row.reward_type,

        status: row.status,

        auto_accepted: row.auto_accepted,

        accepted_at: row.accepted_at,

        tracking_number: row.tracking_number,

        shipped_at: row.shipped_at,

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



export async function rejectOrder(orderId: string): Promise<void> {

  const { error } = await supabase.rpc('reject_order', { p_order_id: orderId });

  if (error) throw new OrderError(error.message);

}



export async function shipOrder(orderId: string, trackingNumber: string | null): Promise<void> {

  const { error } = await supabase.rpc('ship_order', {

    p_order_id: orderId,

    p_tracking_number: trackingNumber?.trim() || null,

  });

  if (error) throw new OrderError(error.message);

}



export function isPendingOrderStatus(status: OrderStatus): boolean {

  return status === 'awaiting_accept' || status === 'pending' || status === 'paid';

}



export function isFulfillmentOrderStatus(status: OrderStatus): boolean {

  return status === 'accepted' || status === 'shipped' || status === 'completed';

}



export interface StoreOrderCounts {

  pendingAccept: number;

  awaitingShip: number;

}



/** AD-055 — 사이드바 뱃지용 가벼운 집계 */
export async function getStoreOrderCounts(storeId: string): Promise<StoreOrderCounts> {

  const { data, error } = await supabase.rpc('get_store_order_counts', { p_store_id: storeId });

  if (error) throw new OrderError(error.message);

  const row = Array.isArray(data) ? data[0] : data;

  return {

    pendingAccept: Number(row?.pending_accept ?? 0),

    awaitingShip: Number(row?.awaiting_ship ?? 0),

  };

}


