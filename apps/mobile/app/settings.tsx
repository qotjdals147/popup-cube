import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { t } from '../src/i18n/ko';
import { useRestoreSystemChromeOnFocus } from '../src/hooks/useWorldImmersiveChrome';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

/** §60 4-C — 쿠팡형 「내정보관리」(⚙️ · 다크 모드) */
export default function SettingsScreen() {
  const router = useRouter();
  const { userId, email, nickname, loading: authLoading, signOut } = useAuth();
  const { colors, isDark, setMode } = useTheme();
  useRestoreSystemChromeOnFocus();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 10,
          backgroundColor: colors.bgCard,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        backBtn: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        backIcon: { fontSize: 32, color: colors.text, lineHeight: 34, marginTop: -2 },
        headerTitle: {
          flex: 1,
          textAlign: 'center',
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
        },
        headerSpacer: { width: 44 },
        scroll: { flex: 1 },
        scrollContent: { padding: 16, paddingBottom: 32 },
        profileRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 8,
          marginBottom: 8,
        },
        avatar: {
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: isDark ? colors.bgElevated : '#eef4ff',
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: { fontSize: 22, fontWeight: '700', color: colors.primary },
        profileName: { fontSize: 18, fontWeight: '700', color: colors.text },
        sectionHeading: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.textSoft,
          marginTop: 16,
          marginBottom: 8,
          marginLeft: 4,
        },
        addressHint: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 4,
          marginBottom: 4,
          marginHorizontal: 4,
          lineHeight: 18,
        },
        card: {
          backgroundColor: colors.bgCard,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        fieldRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        },
        fieldLabel: { fontSize: 14, color: colors.textMuted, flexShrink: 0 },
        fieldValue: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1, textAlign: 'right' },
        divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
        dividerInset: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginLeft: 48,
        },
        menuRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          minHeight: 48,
        },
        menuRowDisabled: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: 48,
          opacity: 0.72,
        },
        menuIcon: { fontSize: 18, width: 28, textAlign: 'center', marginRight: 4 },
        menuLabelFlex: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
        menuBadge: {
          fontSize: 11,
          color: colors.textMuted,
          backgroundColor: colors.bg,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
        },
        logoutBtn: {
          marginTop: 24,
          backgroundColor: colors.bgCard,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 14,
          alignItems: 'center',
        },
        logoutText: { fontSize: 15, fontWeight: '600', color: colors.danger },
      }),
    [colors, isDark],
  );

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace('/');
    }
  }, [authLoading, userId, router]);

  async function handleLogout() {
    await signOut();
    router.replace('/');
  }

  if (authLoading || !userId) {
    return null;
  }

  const displayName = nickname?.trim() || email?.split('@')[0] || t.settings.guest;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.settings.manageTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
        </View>

        <Text style={styles.sectionHeading}>{t.settings.sectionMember}</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t.settings.fieldName}</Text>
            <Text style={styles.fieldValue}>{displayName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t.settings.fieldEmail}</Text>
            <Text style={styles.fieldValue}>{email ? maskEmail(email) : '—'}</Text>
          </View>
        </View>

        <Text style={styles.addressHint}>{t.settings.addressHint}</Text>

        <Text style={styles.sectionHeading}>{t.settings.sectionPreferences}</Text>
        <View style={styles.card}>
          <View style={styles.menuRowDisabled}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuLabelFlex}>{t.settings.menuNotifications}</Text>
            <Text style={styles.menuBadge}>{t.settings.comingSoon}</Text>
          </View>
          <View style={styles.dividerInset} />
          <View style={styles.menuRow}>
            <Text style={styles.menuIcon}>🌙</Text>
            <Text style={styles.menuLabelFlex}>{t.settings.menuDarkMode}</Text>
            <Switch
              value={isDark}
              onValueChange={(value) => void setMode(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              accessibilityLabel={t.settings.menuDarkMode}
            />
          </View>
        </View>

        <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
          <Text style={styles.logoutText}>{t.settings.logout}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
