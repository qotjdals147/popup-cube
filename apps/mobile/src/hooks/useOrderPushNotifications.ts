import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getSupabase } from '../lib/supabase';
import { registerPushToken } from '../lib/orderNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** AD-069 — 주문 보류/취소/보완 Realtime → 로컬 푸시 + Expo token 등록 */
export function useOrderPushNotifications(userId: string | null) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;

    let channel: ReturnType<ReturnType<typeof getSupabase>['channel']> | null = null;

    async function setup() {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        if (!registeredRef.current) {
          await registerPushToken(tokenData.data);
          registeredRef.current = true;
        }

        channel = getSupabase()
          .channel(`order-notifications:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'order_notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const row = payload.new as { title?: string; body?: string };
              void Notifications.scheduleNotificationAsync({
                content: {
                  title: row.title ?? '주문 알림',
                  body: row.body ?? '',
                  sound: true,
                },
                trigger: null,
              });
            },
          )
          .subscribe();
      } catch {
        // 푸시 미설정·시뮬레이터 등 — 앱 동작은 계속
      }
    }

    void setup();

    return () => {
      if (channel) void getSupabase().removeChannel(channel);
    };
  }, [userId]);
}
