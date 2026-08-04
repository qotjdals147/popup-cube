import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoreOrderCounts } from '../lib/orders';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';

export interface OwnerOrderCounts {
  pendingAccept: number;
  awaitingShip: number;
}

interface UseOwnerOrderRealtimeOptions {
  /** 「주문」탭을 보고 있을 때는 토스트 생략 (목록이 바로 보임) */
  suppressNewOrderToast?: boolean;
}

/**
 * AD-055 — 점주 매장 주문 Realtime 구독 + 사이드바 뱃지 집계.
 * Socket.io(월드)와 분리. Supabase `orders` postgres_changes 사용.
 */
export function useOwnerOrderRealtime(
  storeId: string | undefined,
  options: UseOwnerOrderRealtimeOptions = {}
) {
  const { suppressNewOrderToast = false } = options;
  const suppressRef = useRef(suppressNewOrderToast);
  suppressRef.current = suppressNewOrderToast;

  const [counts, setCounts] = useState<OwnerOrderCounts>({
    pendingAccept: 0,
    awaitingShip: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshCounts = useCallback(async () => {
    if (!storeId) return;
    try {
      const next = await getStoreOrderCounts(storeId);
      setCounts(next);
    } catch {
      // 뱃지 실패는 화면 전체를 막지 않음
    }
  }, [storeId]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`owner-orders:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          setRefreshTick((n) => n + 1);
          void refreshCounts();
          if (payload.eventType === 'INSERT' && !suppressRef.current) {
            setToastMessage(t('ownerOrders.toastNewOrder'));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [storeId, refreshCounts]);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  return {
    pendingAccept: counts.pendingAccept,
    awaitingShip: counts.awaitingShip,
    toastMessage,
    dismissToast,
    refreshTick,
    refreshCounts,
  };
}
