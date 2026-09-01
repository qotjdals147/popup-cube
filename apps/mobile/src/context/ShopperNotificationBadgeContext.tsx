import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { countUnreadNotifications } from '../lib/notifications';
import { getSupabase } from '../lib/supabase';

interface ShopperNotificationBadgeContextValue {
  unreadCount: number;
}

const ShopperNotificationBadgeContext =
  createContext<ShopperNotificationBadgeContextValue | null>(null);

/** AD-076 — 알림 unread 뱃지 · Realtime 구독은 앱당 1회 (동일 channel name 중복 subscribe 방지) */
export function ShopperNotificationBadgeProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
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

  const reloadRef = useRef(reload);
  reloadRef.current = reload;

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
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => void reloadRef.current(),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => void reloadRef.current(),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => void reloadRef.current(),
      )
      .subscribe();

    return () => {
      void getSupabase().removeChannel(channel);
    };
  }, [userId]);

  return (
    <ShopperNotificationBadgeContext.Provider value={{ unreadCount }}>
      {children}
    </ShopperNotificationBadgeContext.Provider>
  );
}

export function useShopperNotificationBadge(): number {
  const ctx = useContext(ShopperNotificationBadgeContext);
  if (!ctx) {
    throw new Error('useShopperNotificationBadge must be used within ShopperNotificationBadgeProvider');
  }
  return ctx.unreadCount;
}
