import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useShopperNotificationBadge } from '../hooks/useShopperNotificationBadge';
import { t } from '../i18n/ko';

interface ShopperNotificationBellProps {
  /** 헤더용 = 44px 터치 · compact = 작은 아이콘 */
  size?: 'header' | 'compact';
}

/** AD-076 — 쿠팡형 홈 우측 상단 알림 종 */
export function ShopperNotificationBell({ size = 'header' }: ShopperNotificationBellProps) {
  const router = useRouter();
  const unreadCount = useShopperNotificationBadge();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minWidth: size === 'header' ? 44 : 36,
          minHeight: size === 'header' ? 44 : 36,
        },
        icon: {
          fontSize: size === 'header' ? 22 : 18,
          lineHeight: size === 'header' ? 24 : 20,
        },
        badge: {
          position: 'absolute',
          top: size === 'header' ? 4 : 0,
          right: size === 'header' ? 2 : 0,
          minWidth: 18,
          height: 18,
          paddingHorizontal: 4,
          borderRadius: 9,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        badgeText: {
          color: '#fff',
          fontSize: 10,
          fontWeight: '700',
          lineHeight: 12,
        },
      }),
    [colors.primary, size],
  );

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0
          ? `${t.me.openNotifications} (${unreadCount})`
          : t.me.openNotifications
      }
      onPress={() => router.push('/me/notifications' as Href)}
    >
      <Text style={styles.icon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}
