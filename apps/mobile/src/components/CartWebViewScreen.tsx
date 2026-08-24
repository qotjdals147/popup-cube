import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useCartCount } from '../context/CartCountContext';
import { useTheme } from '../context/ThemeContext';
import {
  buildCartHydrateAndNotifyScript,
  buildCartHydrateScript,
  buildCartWebViewUrl,
  CART_COUNT_INJECT_SCRIPT,
} from '../lib/cartWebView';
import { buildWebViewBackgroundInject } from '../lib/webviewThemeInject';
import { t } from '../i18n/ko';

export function CartWebViewScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const { handleWebViewMessage, itemsJson, bridgeReady } = useCartCount();
  const { colors, mode } = useTheme();
  const [ready, setReady] = useState(false);
  const [cartUrl, setCartUrl] = useState<string | null>(null);
  const [webError, setWebError] = useState<string | null>(null);
  const [webLoaded, setWebLoaded] = useState(false);

  useEffect(() => {
    if (!bridgeReady) return;
    let active = true;
    setReady(false);
    setWebError(null);
    setWebLoaded(false);

    buildCartWebViewUrl(mode)
      .then((url) => {
        if (!active) return;
        if (!url) {
          setWebError(t.me.sessionMissing);
        } else {
          setCartUrl(url);
        }
        setReady(true);
      })
      .catch(() => {
        if (active) {
          setWebError(t.me.loadError);
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [mode, bridgeReady]);

  const backgroundInject = useMemo(() => buildWebViewBackgroundInject(mode), [mode]);

  const beforeLoadInject = useMemo(
    () => `${buildCartHydrateScript(itemsJson)}\n${backgroundInject}`,
    [itemsJson, backgroundInject],
  );

  useFocusEffect(
    useCallback(() => {
      if (!webLoaded) return;
      webViewRef.current?.injectJavaScript(buildCartHydrateAndNotifyScript(itemsJson));
    }, [itemsJson, webLoaded]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: colors.bg,
        },
        webview: { flex: 1, backgroundColor: colors.bg },
        webviewHidden: { opacity: 0 },
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
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 10,
        },
        buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
      }),
    [colors],
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleWebViewMessage(event);
      try {
        const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
        if (msg.type === 'navigate_home') {
          router.replace('/home');
        }
      } catch {
        // ignore
      }
    },
    [handleWebViewMessage, router],
  );

  if (!bridgeReady || !ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>{t.me.loading}</Text>
      </View>
    );
  }

  if (!cartUrl || webError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{webError ?? t.me.loadError}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/home')}>
          <Text style={styles.buttonText}>{t.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: cartUrl }}
        style={[styles.webview, !webLoaded && styles.webviewHidden]}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={beforeLoadInject}
        injectedJavaScript={CART_COUNT_INJECT_SCRIPT}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        onLoadEnd={() => setWebLoaded(true)}
        onError={() => setWebError(t.me.loadError)}
        onHttpError={() => setWebError(t.me.loadError)}
      />
    </View>
  );
}
