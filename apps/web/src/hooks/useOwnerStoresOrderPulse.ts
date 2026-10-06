import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 점주 `/home` — 소유 매장 `orders` Realtime + **다른 탭/앱 갔다가 돌아올 때** KPI 갱신 (ISS-056).
 * 주기 폴링 없음 — 작업 중 갑자기 목록이 로딩되는 일 방지.
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

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      for (const ch of channels) {
        void supabase.removeChannel(ch);
      }
    };
  }, [enabled, key, onPulse, storeIds]);
}
