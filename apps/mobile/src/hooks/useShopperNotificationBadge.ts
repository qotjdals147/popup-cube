import { useCallback, useEffect, useState } from 'react';
import { countUnreadNotifications } from '../lib/notifications';
import { getSupabase } from '../lib/supabase';

/** AD-076 — 마이 허브 알림 뱃지 + Realtime */
export function useShopperNotificationBadge(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  const reload = useCallback(async () => {
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
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!userId) return;

    const channel = getSupabase()
      .channel(`shopper-notification-badge:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => void reload(),
      )
      .subscribe();

    return () => {
      void getSupabase().removeChannel(channel);
    };
  }, [userId, reload]);

  return unreadCount;
}
