import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import Constants from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import { useWorldImmersiveChrome } from '../../src/hooks/useWorldImmersiveChrome';
import { applyWorldImmersiveChrome } from '../../src/lib/worldImmersive';
import { t } from '../../src/i18n/ko';
import { getStoreSummary } from '../../src/lib/stores';
import { getSupabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import type { StoreSummary } from '../../src/types/domain';

function readWebOrigin(): string {
  const extra = Constants.expoConfig?.extra as { webOrigin?: string } | undefined;
  const fromExtra = extra?.webOrigin?.trim();
  if (fromExtra) return fromExtra.replace(/\/$/, '');
  const fromEnv = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'https://popup-cube-web.vercel.app';
}

/**
 * Sprint 4-1 — 앱 매장 입장 = WebView로 웹 `/play/:storeId` Phaser 월드 로드.
 * 세션은 해시로 전달 (access_token / refresh_token).
 */
export default function StoreScreen() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { userId, loading: authLoading, role } = useAuth();
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [webError, setWebError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace('/');
    }
  }, [authLoading, userId, router]);

  /** Expo Go: app.config orientation만으론 회전 안 될 수 있음 → 매장(WebView)에서 런타임 허용 (ISS-030) */
  useEffect(() => {
    void (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
      } catch (err) {
        console.warn('[store] orientation ALL failed:', err);
      }
    })();
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    if (!storeId) return;
    setLoadingMeta(true);
    getStoreSummary(storeId)
      .then(setStore)
      .finally(() => setLoadingMeta(false));
  }, [storeId]);

  useEffect(() => {
    if (!storeId || !userId) return;
    let active = true;
    setSessionReady(false);
    setWebError(null);

    (async () => {
      const { data, error } = await getSupabase().auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setWebError(t.store.sessionMissing);
        setSessionReady(true);
        return;
      }
      const origin = readWebOrigin();
      const hash = new URLSearchParams({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }).toString();
      setPlayUrl(`${origin}/play/${encodeURIComponent(storeId)}#${hash}`);
      setSessionReady(true);
    })();

    return () => {
      active = false;
    };
  }, [storeId, userId]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
        if (msg.type === 'navigate_home') {
          router.replace('/home');
        }
      } catch {
        // ignore non-JSON
      }
    },
    [router]
  );

  const headerTitle = useMemo(
    () => store?.name ?? storeId ?? '',
    [store?.name, storeId]
  );

  /** 로딩 중에도 매장 화면이면 몰입 시도 (WebView 뜨기 전 상단바 잔류 방지) */
  const worldChromeActive = !webError && Boolean(storeId && userId && !authLoading);
  useWorldImmersiveChrome(worldChromeActive);

  if (authLoading || loadingMeta || !sessionReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>{t.store.loadingWorld}</Text>
      </View>
    );
  }

  if (!playUrl || webError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.storeName}>{headerTitle}</Text>
        <Text style={styles.error}>{webError ?? t.store.worldError}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/home')}>
          <Text style={styles.buttonText}>{t.store.backHome}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden style="light" />
      {role === 'owner' && (
        <View style={styles.ownerBar}>
          <Text style={styles.ownerBarText}>{t.store.ownerHint}</Text>
        </View>
      )}
      <WebView
        source={{ uri: playUrl }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={onMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>{t.store.loadingWorld}</Text>
          </View>
        )}
        onError={() => setWebError(t.store.worldError)}
        onHttpError={() => setWebError(t.store.worldError)}
        onLoadEnd={() => {
          void applyWorldImmersiveChrome();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webview: { flex: 1, backgroundColor: colors.bg },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: colors.textMuted, marginTop: 12, fontSize: 14 },
  storeName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  error: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: 28,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  ownerBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#334155',
  },
  ownerBarText: { color: colors.textSoft, fontSize: 12, textAlign: 'center' },
});
