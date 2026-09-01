import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createSessionFromOAuthUrl } from '../src/lib/googleSignIn';
import { colors } from '../src/theme/colors';

/** AD-078 — OAuth deep link (`popupcube://login-callback`) */
export default function LoginCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function finish(url: string | null) {
      if (!url) {
        if (active) {
          setError('로그인 정보가 없어요.');
        }
        return;
      }
      const { error: sessionError } = await createSessionFromOAuthUrl(url);
      if (!active) return;
      if (sessionError) {
        setError(sessionError);
        return;
      }
      router.replace('/home');
    }

    void Linking.getInitialURL().then((url) => void finish(url));

    const sub = Linking.addEventListener('url', ({ url }) => {
      void finish(url);
    });

    return () => {
      active = false;
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
