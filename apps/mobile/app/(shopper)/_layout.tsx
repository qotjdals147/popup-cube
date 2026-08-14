import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { ShopperBottomNav, type ShopperTab } from '../../src/components/ShopperBottomNav';
import { useTheme } from '../../src/context/ThemeContext';
import { useShopperSystemBackground } from '../../src/hooks/useShopperSystemBackground';

function routeToTab(routeName: string): ShopperTab {
  if (routeName === 'cart') return 'cart';
  if (routeName === 'me') return 'me';
  return 'home';
}

function ShopperTabBar({ state, navigation }: BottomTabBarProps) {
  const active = routeToTab(state.routes[state.index]?.name ?? 'home');

  return (
    <ShopperBottomNav
      active={active}
      onNavigate={(tab) => {
        if (tab === active) return;
        navigation.navigate(tab);
      }}
    />
  );
}

/**
 * §60 4-B — 홈·마이·장바구니 **Tabs** (화면 유지 · 전환 애니 없음 → 다크 흰 번쩍임 방지)
 */
export default function ShopperTabsLayout() {
  const { colors } = useTheme();
  useShopperSystemBackground();

  return (
    <Tabs
      tabBar={(props) => <ShopperTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: 'none',
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="me" />
      <Tabs.Screen name="cart" />
    </Tabs>
  );
}
