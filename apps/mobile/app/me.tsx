import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeBottomNav } from '../src/components/HomeBottomNav';
import { useAuth } from '../src/context/AuthContext';
import { t } from '../src/i18n/ko';
import { getSupabase } from '../src/lib/supabase';
import { colors } from '../src/theme/colors';

function readWebOrigin(): string {
  const extra = Constants.expoConfig?.extra as { webOrigin?: string } | undefined;
  const fromExtra = extra?.webOrigin?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, '');
  const fromEnv = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'https://popup-cube-web.vercel.app';
}

/** m10 — 손님 「내 정보」(구매 내역 · 배송지) WebView → `/app/me` */
export default function MeScreen() {
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();
  const [sessionReady, setSessionReady] = useState(false);
  const [accountUrl, setAccountUrl] = useState<string | null>(null);
  const [webError, setWebError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace('/');
    }
  }, [authLoading, userId, router]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setSessionReady(false);
    setWebError(null);

    (async () => {
      const { data, error } = await getSupabase().auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setWebError(t.me.sessionMissing);
        setSessionReady(true);
        return;
      }
      const origin = readWebOrigin();
      const hash = new URLSearchParams({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }).toString();
      setAccountUrl(`${origin}/app/me#${hash}`);
      setSessionReady(true);
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
        if (msg.type === 'navigate_home') {
          router.replace('/home');
        }
      } catch {
        // ignore
      }
    },
    [router]
  );

  if (authLoading || !sessionReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>{t.me.loading}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!accountUrl || webError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{webError ?? t.me.loadError}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/home')}>
            <Text style={styles.buttonText}>{t.me.backHome}</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          source={{ uri: accountUrl }}
          style={styles.webview}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}
          onError={() => setWebError(t.me.loadError)}
          onHttpError={() => setWebError(t.me.loadError)}
        />
      )}
      <HomeBottomNav active="me" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webview: { flex: 1, backgroundColor: colors.bg },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: { color: colors.textMuted, marginTop: 12, fontSize: 14 },
  error: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: 24,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
