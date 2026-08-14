import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { CartCountProvider } from '../src/context/CartCountContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

/** Expo Go — expo-splash-screen 네이티브 호출은 SDK57에서 크래시 유발 가능 → 사용 안 함 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <CartCountProvider>
            <ThemedStack />
          </CartCountProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function ThemedStack() {
  const { colors, isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bg },
        statusBarStyle: isDark ? 'light' : 'dark',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: '로그인' }} />
      <Stack.Screen name="home" options={{ title: 'POP-UP CUBE', headerShown: false }} />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen name="me" options={{ headerShown: false }} />
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
  );
}
