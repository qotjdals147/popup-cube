import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/** 손님 주문 — return/claim/status 변경 시 목록 갱신 */
export function useShopperOrderRealtime(userId: string | null | undefined) {
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`shopper-orders:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        () => setRefreshTick((n) => n + 1),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return { refreshTick, bumpRefresh: () => setRefreshTick((n) => n + 1) };
}
