import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { t } from '../src/i18n/ko';
import { colors } from '../src/theme/colors';
import { useRestoreSystemChromeOnFocus } from '../src/hooks/useWorldImmersiveChrome';

/** m01 — 일반 회원 / 스토어 관리자 로그인 분기 (AD-037) */
export default function LandingScreen() {
  const router = useRouter();
  const { initError } = useAuth();
  useRestoreSystemChromeOnFocus();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        {initError && <Text style={styles.configError}>{initError}</Text>}

        <Text style={styles.title}>{t.landing.title}</Text>
        <Text style={styles.subtitle}>{t.landing.subtitle}</Text>
        <Text style={styles.tagline}>{t.landing.tagline}</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push({ pathname: '/login', params: { role: 'shopper' } })}
        >
          <Text style={styles.primaryButtonText}>{t.landing.shopperButton}</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push({ pathname: '/login', params: { role: 'owner' } })}
        >
          <Text style={styles.secondaryButtonText}>{t.landing.ownerButton}</Text>
        </Pressable>

        <Text style={styles.ownerNote}>{t.landing.ownerNote}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  configError: {
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  ownerNote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
});
