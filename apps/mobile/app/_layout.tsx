import { Stack } from 'expo-router';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useMemo } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { CartCountProvider } from '../src/context/CartCountContext';
import { ShopperNotificationBadgeProvider } from '../src/context/ShopperNotificationBadgeContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { shopperDark } from '../src/theme/shopperTheme';

/** Expo Go — expo-splash-screen 네이티브 호출은 SDK57에서 크래시 유발 가능 → 사용 안 함 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <CartCountProvider>
            <ShopperNotificationBadgeProvider>
              <ThemedStack />
            </ShopperNotificationBadgeProvider>
          </CartCountProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function ThemedStack() {
  const { colors, isDark, ready } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.bg,
        card: colors.bgCard,
        text: colors.text,
        border: colors.border,
      },
    }),
    [colors, isDark],
  );

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: shopperDark.bg }} />;
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgCard },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
          statusBarStyle: isDark ? 'light' : 'dark',
          animation: 'fade',
          animationDuration: 120,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: '로그인' }} />
        <Stack.Screen name="(shopper)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen
          name="store/[storeId]"
          options={{
            title: '매장',
            headerShown: false,
            statusBarStyle: isDark ? 'light' : 'dark',
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
