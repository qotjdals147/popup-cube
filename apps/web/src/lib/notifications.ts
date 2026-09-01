import type { ShopperNotificationView } from '@popup-cube/shared';
import { supabase } from './supabase';

type NotificationRow = {
  id: string;
  order_id: string | null;
  event_type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  store_code: string | null;
  order_number: number | null;
};

function mapRow(row: NotificationRow): ShopperNotificationView {
  return {
    id: row.id,
    order_id: row.order_id,
    event_type: row.event_type,
    title: row.title,
    body: row.body,
    read_at: row.read_at,
    created_at: row.created_at,
    store_code: row.store_code,
    order_number: row.order_number,
  };
}

export async function listMyNotifications(limit = 50): Promise<ShopperNotificationView[]> {
  const { data, error } = await supabase.rpc('list_my_notifications', { p_limit: limit });
  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(mapRow);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw error;
}

export async function countUnreadNotifications(): Promise<number> {
  const { data, error } = await supabase.rpc('count_my_unread_notifications');
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}
