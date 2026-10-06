import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const OWNER_ORDER_POLL_MS = 45_000;

/**
 * 점주 `/home` — 소유 매장 `orders` Realtime + 탭 포커스·주기 폴링 (ISS-056).
 * KPI·할 일 뱃지는 `get_store_kpi` 1회만 쓰던 경로 보강.
 */
export function useOwnerStoresOrderPulse(
  storeIds: string[],
  onPulse: () => void,
  enabled: boolean,
) {
  const key = storeIds.slice().sort().join(',');

  useEffect(() => {
    if (!enabled || storeIds.length === 0) return;

    const bump = () => onPulse();

    const channels = storeIds.map((storeId) =>
      supabase
        .channel(`owner-home-orders:${storeId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `store_id=eq.${storeId}`,
          },
          bump,
        )
        .subscribe(),
    );

    const onVisible = () => {
      if (document.visibilityState === 'visible') bump();
    };
    document.addEventListener('visibilitychange', onVisible);

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') bump();
    }, OWNER_ORDER_POLL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
      for (const ch of channels) {
        void supabase.removeChannel(ch);
      }
    };
  }, [enabled, key, onPulse, storeIds]);
}
