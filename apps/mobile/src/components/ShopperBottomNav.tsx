import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCartCount } from '../context/CartCountContext';
import { useTheme } from '../context/ThemeContext';
import { useShopperNotificationBadge } from '../hooks/useShopperNotificationBadge';
import { t } from '../i18n/ko';

export type ShopperTab = 'home' | 'me' | 'cart';

const TABS: { id: ShopperTab; label: string; icon: string; href: '/home' | '/me' | '/cart' }[] = [
  { id: 'home', label: t.nav.home, icon: '🏠', href: '/home' },
  { id: 'me', label: t.nav.me, icon: '👤', href: '/me' },
  { id: 'cart', label: t.nav.cart, icon: '🛒', href: '/cart' },
];

/** §60 4-B — 쿠팡형 하단 3탭 (홈 · 마이 · 장바구니) · 설정=마이 ⚙️ */
export function ShopperBottomNav({
  active,
  onNavigate,
}: {
  active: ShopperTab;
  onNavigate?: (tab: ShopperTab) => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const unreadNotifications = useShopperNotificationBadge(userId);
  const { count: cartCount } = useCartCount();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.bgCard,
          paddingTop: 6,
        },
        item: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 4,
          minHeight: 52,
          position: 'relative',
        },
        activeIndicator: {
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: 2,
          backgroundColor: colors.primary,
          borderRadius: 1,
        },
        icon: {
          fontSize: 20,
          lineHeight: 24,
        },
        iconWrap: {
          position: 'relative',
          marginBottom: 2,
        },
        badge: {
          position: 'absolute',
          top: -4,
          right: -10,
          minWidth: 16,
          height: 16,
          paddingHorizontal: 4,
          borderRadius: 8,
          backgroundColor: colors.price,
          alignItems: 'center',
          justifyContent: 'center',
        },
        badgeText: {
          color: '#fff',
          fontSize: 10,
          fontWeight: '700',
          lineHeight: 12,
        },
        label: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '600',
        },
        labelActive: {
          color: colors.primary,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const showCartBadge = tab.id === 'cart' && cartCount > 0;
        const showMeBadge = tab.id === 'me' && unreadNotifications > 0;
        const badgeCount = tab.id === 'cart' ? cartCount : unreadNotifications;
        const showBadge = showCartBadge || showMeBadge;
        return (
          <Pressable
            key={tab.id}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (isActive) return;
              if (onNavigate) {
                onNavigate(tab.id);
              } else {
                router.navigate(tab.href as Href);
              }
            }}
          >
            {isActive && <View style={styles.activeIndicator} />}
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{tab.icon}</Text>
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
