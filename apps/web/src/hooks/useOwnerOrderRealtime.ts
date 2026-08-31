import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoreOrderCounts } from '../lib/orders';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';

export interface OwnerOrderCounts {
  pendingAccept: number;
  awaitingShip: number;
  onHold: number;
  openClaims: number;
  openReturns: number;
}

interface UseOwnerOrderRealtimeOptions {
  /** 「주문」탭을 보고 있을 때는 토스트 생략 (목록이 바로 보임) */
  suppressNewOrderToast?: boolean;
  /** 「반품·교환·문의」탭 — 반품·문의 토스트 생략 */
  suppressCsToast?: boolean;
}

/**
 * AD-055 — 점주 매장 주문 Realtime 구독 + 사이드바 뱃지 집계.
 * Socket.io(월드)와 분리. Supabase `orders` postgres_changes 사용.
 */
export function useOwnerOrderRealtime(
  storeId: string | undefined,
  options: UseOwnerOrderRealtimeOptions = {}
) {
  const { suppressNewOrderToast = false, suppressCsToast = false } = options;
  const suppressOrderRef = useRef(suppressNewOrderToast);
  const suppressCsRef = useRef(suppressCsToast);
  suppressOrderRef.current = suppressNewOrderToast;
  suppressCsRef.current = suppressCsToast;

  const [counts, setCounts] = useState<OwnerOrderCounts>({
    pendingAccept: 0,
    awaitingShip: 0,
    onHold: 0,
    openClaims: 0,
    openReturns: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const countsInitializedRef = useRef(false);

  const refreshCounts = useCallback(async () => {
    if (!storeId) return;
    try {
      const next = await getStoreOrderCounts(storeId);
      setCounts((prev) => {
        if (countsInitializedRef.current && !suppressCsRef.current) {
          if (next.openReturns > prev.openReturns) {
            setToastMessage(t('ownerOrders.toastNewReturn'));
          } else if (next.openClaims > prev.openClaims) {
            setToastMessage(t('ownerOrders.toastNewClaim'));
          }
        }
        countsInitializedRef.current = true;
        return next;
      });
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
          if (payload.eventType === 'INSERT' && !suppressOrderRef.current) {
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
    onHold: counts.onHold,
    openClaims: counts.openClaims,
    openReturns: counts.openReturns,
    toastMessage,
    dismissToast,
    refreshTick,
    refreshCounts,
  };
}
