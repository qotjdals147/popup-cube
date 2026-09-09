import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  createSessionFromOAuthUrl,
  isOAuthFlowActive,
  waitForOAuthSession,
} from '../src/lib/oauthExchange';
import { getSupabase } from '../src/lib/supabase';
import { colors } from '../src/theme/colors';

/** AD-078 — OAuth deep link (`popupcube://login-callback`) */
export default function LoginCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let finished = false;

    async function goHomeIfSession(): Promise<boolean> {
      const { data } = await getSupabase().auth.getSession();
      if (data.session) {
        if (active) {
          finished = true;
          router.replace('/home');
        }
        return true;
      }
      return false;
    }

    async function finish(url: string | null) {
      if (finished) return;

      if (await goHomeIfSession()) return;

      // login.tsx Google 버튼이 교환 중 — login-callback은 세션만 대기
      if (isOAuthFlowActive()) {
        const ok = await waitForOAuthSession(5000);
        if (!active) return;
        finished = true;
        router.replace(ok ? '/home' : '/login');
        return;
      }

      if (!url || !url.includes('login-callback')) {
        if (active) {
          finished = true;
          router.replace('/');
        }
        return;
      }

      const { error: sessionError } = await createSessionFromOAuthUrl(url);
      if (!active) return;
      finished = true;
      if (sessionError) {
        setError(sessionError);
        return;
      }
      router.replace('/home');
    }

    const timeout = setTimeout(() => {
      if (active && !finished) {
        finished = true;
        router.replace('/');
      }
    }, 8000);

    void (async () => {
      try {
        const getUrl = Linking.getInitialURL;
        if (typeof getUrl !== 'function') return;
        const url = await Promise.resolve(getUrl());
        await finish(url);
      } catch {
        if (active && !finished) {
          finished = true;
          router.replace('/');
        }
      }
    })();

    const sub = Linking.addEventListener('url', ({ url }) => {
      void finish(url);
    });

    return () => {
      active = false;
      clearTimeout(timeout);
      sub.remove();
    };
  }, [router]);

  return (
    <View style={styles.wrap}>
      {!error ? (
        <>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.hint}>로그인 처리 중...</Text>
        </>
      ) : (
        <>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.link} onPress={() => router.replace('/login')}>
            로그인으로 돌아가기
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
    gap: 12,
  },
  hint: { color: colors.textMuted, fontSize: 14 },
  error: { color: '#fca5a5', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  link: { color: colors.textSoft, fontSize: 14, textDecorationLine: 'underline', marginTop: 8 },
});
