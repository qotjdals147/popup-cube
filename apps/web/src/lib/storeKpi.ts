import { supabase } from './supabase';

export interface StoreKpi {
  popup_started_at: string;
  popup_ends_at: string | null;
  today_order_count: number;
  today_revenue: number;
  popup_order_count: number;
  popup_revenue: number;
  pending_accept: number;
  awaiting_ship: number;
  on_hold: number;
  low_stock_count: number;
  auto_accept_exhausted_count: number;
}

export interface StoreSalesDailyRow {
  sales_day: string;
  order_count: number;
  revenue: number;
}

export interface StoreProductSalesRow {
  product_id: string;
  product_name: string;
  image_url: string | null;
  units_sold: number;
  revenue: number;
}

export async function getStoreKpi(storeId: string): Promise<StoreKpi | null> {
  const { data, error } = await supabase.rpc('get_store_kpi', { p_store_id: storeId });
  if (error) throw error;
  const row = (data ?? [])[0] as StoreKpi | undefined;
  return row ?? null;
}

export async function getStoreSalesDaily(storeId: string, days = 7): Promise<StoreSalesDailyRow[]> {
  const { data, error } = await supabase.rpc('get_store_sales_daily', {
    p_store_id: storeId,
    p_days: days,
  });
  if (error) throw error;
  return (data ?? []) as StoreSalesDailyRow[];
}

export async function getStoreProductSales(
  storeId: string,
  limit = 8
): Promise<StoreProductSalesRow[]> {
  const { data, error } = await supabase.rpc('get_store_product_sales', {
    p_store_id: storeId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as StoreProductSalesRow[];
}

export function formatWon(amount: number): string {
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}
