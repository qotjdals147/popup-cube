import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function MeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: colors.bg },
        statusBarStyle: 'dark',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ title: '구매 내역 · 배송지' }} />
      <Stack.Screen name="addresses" options={{ title: '배송지 관리' }} />
    </Stack>
  );
}
