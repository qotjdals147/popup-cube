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
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
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
 * v1 손님 매장 입장 — WebView `/store/:storeId/shop` 쇼핑몰 (AD-062 · §58).
 * 세션은 해시로 전달 (access_token / refresh_token).
 */
export default function StoreScreen() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { userId, loading: authLoading, role } = useAuth();
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [shopUrl, setShopUrl] = useState<string | null>(null);
  const [webError, setWebError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace('/');
    }
  }, [authLoading, userId, router]);

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
      setShopUrl(`${origin}/store/${encodeURIComponent(storeId)}/shop#${hash}`);
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
        if (msg.type === 'webview_blank') {
          setWebError(t.store.shopNeedsDeploy);
        }
      } catch {
        // ignore non-JSON
      }
    },
    [router]
  );

  const blankCheckScript = `
    (function() {
      setTimeout(function() {
        var root = document.getElementById('root');
        var empty = !root || root.childElementCount === 0;
        var hasShop = !!document.querySelector('.store-shop-page');
        var hasPlay = !!document.querySelector('.play-world-page');
        if (empty && !hasShop && !hasPlay && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'webview_blank' }));
        }
      }, 1800);
    })();
    true;
  `;

  const headerTitle = useMemo(
    () => store?.name ?? storeId ?? '',
    [store?.name, storeId]
  );

  if (authLoading || loadingMeta || !sessionReady) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>{t.store.loadingShop}</Text>
      </View>
    );
  }

  if (!shopUrl || webError) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <Text style={styles.storeName}>{headerTitle}</Text>
        <Text style={styles.error}>{webError ?? t.store.shopError}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/home')}>
          <Text style={styles.buttonText}>{t.store.backHome}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {role === 'owner' && (
        <View style={styles.ownerBar}>
          <Text style={styles.ownerBarText}>{t.store.ownerHint}</Text>
        </View>
      )}
      <WebView
        source={{ uri: shopUrl }}
        style={styles.webview}
        scrollEnabled
        bounces
        overScrollMode="always"
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
            <Text style={styles.loadingText}>{t.store.loadingShop}</Text>
          </View>
        )}
        onError={() => setWebError(t.store.shopError)}
        onHttpError={() => setWebError(t.store.shopError)}
        injectedJavaScript={blankCheckScript}
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
