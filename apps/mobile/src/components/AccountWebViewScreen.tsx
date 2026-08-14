import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { buildAccountWebViewUrl, type AccountWebEmbed, type AccountWebTab } from '../lib/accountWebView';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n/ko';

interface AccountWebViewScreenProps {
  tab: AccountWebTab;
  embed?: AccountWebEmbed;
}

export function AccountWebViewScreen({ tab, embed = 'page' }: AccountWebViewScreenProps) {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const [ready, setReady] = useState(false);
  const [accountUrl, setAccountUrl] = useState<string | null>(null);
  const [webError, setWebError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setReady(false);
    setWebError(null);

    buildAccountWebViewUrl(tab, embed, mode)
      .then((url) => {
        if (!active) return;
        if (!url) {
          setWebError(t.me.sessionMissing);
        } else {
          setAccountUrl(url);
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
  }, [tab, embed, mode]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: colors.bg,
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
      try {
        const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
        if (msg.type === 'navigate_home') {
          router.replace('/home');
        }
      } catch {
        // ignore
      }
    },
    [router],
  );

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>{t.me.loading}</Text>
      </View>
    );
  }

  if (!accountUrl || webError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{webError ?? t.me.loadError}</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>{t.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
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
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      onError={() => setWebError(t.me.loadError)}
      onHttpError={() => setWebError(t.me.loadError)}
    />
  );
}
