import { Stack } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';

export default function MeLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: colors.bg },
        statusBarStyle: isDark ? 'light' : 'dark',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ title: '주문내역' }} />
      <Stack.Screen name="notifications" options={{ title: '알림' }} />
      <Stack.Screen name="addresses" options={{ title: '배송지 관리' }} />
    </Stack>
  );
}
