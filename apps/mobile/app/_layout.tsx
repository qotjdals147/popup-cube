import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

/** Expo Go — expo-splash-screen 네이티브 호출은 SDK57에서 크래시 유발 가능 → 사용 안 함 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/*
          루트 StatusBar를 두면 매장 몰입(AD-050)의 hidden과 충돌해 상단 시계/배터리가 계속 보일 수 있음.
          화면별로 Stack statusBar* 옵션 + store 쪽 expo-status-bar 사용.
        */}
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: colors.bg },
            statusBarStyle: 'light',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: '로그인' }} />
          <Stack.Screen name="home" options={{ title: 'POP-UP CUBE' }} />
          <Stack.Screen
            name="store/[storeId]"
            options={{
              title: '매장',
              headerShown: false,
              statusBarHidden: true,
              statusBarTranslucent: true,
              navigationBarColor: '#00000000',
            }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
