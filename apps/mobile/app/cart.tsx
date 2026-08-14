import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopperBottomNav } from '../src/components/ShopperBottomNav';
import { useAuth } from '../src/context/AuthContext';
import { t } from '../src/i18n/ko';
import { colors } from '../src/theme/colors';
import { useRestoreSystemChromeOnFocus } from '../src/hooks/useWorldImmersiveChrome';

/** §60 4-B — 장바구니 탭 shell (전체화면 장바구니 = 4-D) */
export default function CartScreen() {
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();
  useRestoreSystemChromeOnFocus();

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace('/');
    }
  }, [authLoading, userId, router]);

  if (authLoading || !userId) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.cart.title}</Text>
      </View>

      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon} accessibilityElementsHidden>
          🛒
        </Text>
        <Text style={styles.emptyTitle}>{t.cart.emptyTitle}</Text>
        <Text style={styles.emptyBody}>{t.cart.emptyBody}</Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/home')}>
          <Text style={styles.ctaText}>{t.cart.browseStores}</Text>
        </Pressable>
        <Text style={styles.hint}>{t.cart.perStoreHint}</Text>
      </View>

      <ShopperBottomNav active="cart" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
