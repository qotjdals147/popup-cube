import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopperBottomNav } from '../../src/components/ShopperBottomNav';
import { useAuth } from '../../src/context/AuthContext';
import { t } from '../../src/i18n/ko';
import { colors } from '../../src/theme/colors';
import { useRestoreSystemChromeOnFocus } from '../../src/hooks/useWorldImmersiveChrome';

const QUICK_ACTIONS = [
  { id: 'orders', icon: '📦', labelKey: 'orders' as const, href: '/me/orders' as const, enabled: true },
  { id: 'addresses', icon: '📍', labelKey: 'addresses' as const, href: '/me/addresses' as const, enabled: true },
  { id: 'wishlist', icon: '♡', labelKey: 'wishlist' as const, enabled: false },
  { id: 'recent', icon: '👁', labelKey: 'recent' as const, enabled: false },
];

/** §60 4-B — 쿠팡형 「마이」 허브 (네이티브 · WebView는 주문/배송지 화면에서만) */
export default function MeHubScreen() {
  const router = useRouter();
  const { userId, email, nickname, loading: authLoading } = useAuth();
  useRestoreSystemChromeOnFocus();

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace('/');
    }
  }, [authLoading, userId, router]);

  if (authLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!userId) {
    return null;
  }

  const displayName = nickname?.trim() || email?.split('@')[0] || t.me.guest;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileSub}>{t.me.hubTagline}</Text>
            </View>
          </View>
          <Pressable
            style={styles.gearBtn}
            accessibilityLabel={t.me.openSettings}
            onPress={() => router.push('/settings' as Href)}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </Pressable>
        </View>

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={[styles.quickItem, !action.enabled && styles.quickItemDisabled]}
              disabled={!action.enabled}
              onPress={() => {
                if (action.enabled && action.href) {
                  router.push(action.href as Href);
                }
              }}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={[styles.quickLabel, !action.enabled && styles.quickLabelDisabled]}>
                {t.me.quick[action.labelKey]}
              </Text>
              {!action.enabled && <Text style={styles.comingSoon}>{t.me.comingSoon}</Text>}
            </Pressable>
          ))}
        </View>

        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.me.ordersSectionTitle}</Text>
            <Pressable onPress={() => router.push('/me/orders' as Href)} hitSlop={8}>
              <Text style={styles.sectionLink}>{t.me.viewAll}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.ordersTeaser} onPress={() => router.push('/me/orders' as Href)}>
            <Text style={styles.ordersTeaserIcon}>📦</Text>
            <Text style={styles.ordersTeaserTitle}>{t.me.ordersTeaserTitle}</Text>
            <Text style={styles.ordersTeaserBody}>{t.me.ordersTeaserBody}</Text>
            <View style={styles.ordersTeaserBtn}>
              <Text style={styles.ordersTeaserBtnText}>{t.me.ordersTeaserBtn}</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ShopperBottomNav active="me" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  profileText: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 17, fontWeight: '700', color: colors.text },
  profileSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  gearBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gearIcon: { fontSize: 20 },
  quickGrid: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 72,
  },
  quickItemDisabled: { opacity: 0.45 },
  quickIcon: { fontSize: 22, marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  quickLabelDisabled: { color: colors.textMuted },
  comingSoon: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  ordersSection: { paddingTop: 16, paddingHorizontal: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionLink: { fontSize: 13, fontWeight: '600', color: colors.primary },
  ordersTeaser: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  ordersTeaserIcon: { fontSize: 36, marginBottom: 8 },
  ordersTeaserTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  ordersTeaserBody: {
    fontSize: 13,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  ordersTeaserBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ordersTeaserBtnText: { color: colors.primaryText, fontSize: 14, fontWeight: '700' },
});
