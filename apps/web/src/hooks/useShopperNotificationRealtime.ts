import { useCallback, useEffect, useState } from 'react';
import { countUnreadNotifications } from '../lib/notifications';
import { supabase } from '../lib/supabase';

/** AD-076 — 알림 INSERT/UPDATE 시 목록·unread 갱신 */
export function useShopperNotificationRealtime(userId: string | null | undefined) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const reloadUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      setUnreadCount(await countUnreadNotifications());
    } catch {
      setUnreadCount(0);
    }
  }, [userId]);

  useEffect(() => {
    void reloadUnread();
  }, [reloadUnread, refreshTick]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`shopper-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => setRefreshTick((n) => n + 1),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => setRefreshTick((n) => n + 1),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => setRefreshTick((n) => n + 1),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    refreshTick,
    unreadCount,
    bumpRefresh: () => setRefreshTick((n) => n + 1),
    reloadUnread,
  };
}
