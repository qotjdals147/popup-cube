import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { t } from '../src/i18n/ko';
import { useRestoreSystemChromeOnFocus } from '../src/hooks/useWorldImmersiveChrome';
import {
  checkNicknameAvailableForChange,
  isNicknameLengthValid,
  NicknameUpdateError,
  updateMyNickname,
} from '../src/lib/nickname';

type NicknameCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

/** §60 4-C — 쿠팡형 「내정보관리」(⚙️ · 다크 모드) */
export default function SettingsScreen() {
  const router = useRouter();
  const { userId, email, nickname, bootstrapping, loading, signOut, refreshProfile } = useAuth();
  const authPending = bootstrapping || loading;
  const { colors, isDark, setMode } = useTheme();
  useRestoreSystemChromeOnFocus();

  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [nicknameCheck, setNicknameCheck] = useState<NicknameCheckStatus>('idle');
  const [nicknameFormError, setNicknameFormError] = useState<string | null>(null);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameSuccess, setNicknameSuccess] = useState<string | null>(null);

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
        changeLink: { fontSize: 14, fontWeight: '600', color: colors.primary, flexShrink: 0 },
        modalBackdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          padding: 20,
        },
        modalCard: {
          backgroundColor: colors.bgCard,
          borderRadius: 14,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
        },
        modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8 },
        modalHint: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 14 },
        modalInput: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 11,
          fontSize: 15,
          color: colors.text,
          backgroundColor: colors.bg,
          marginBottom: 8,
        },
        modalRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
        modalCheckBtn: {
          paddingHorizontal: 14,
          paddingVertical: 11,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: isDark ? colors.bgElevated : '#eef4ff',
        },
        modalCheckBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
        modalHintOk: { fontSize: 13, color: '#16a34a', marginBottom: 8 },
        modalHintWarn: { fontSize: 13, color: colors.danger, marginBottom: 8 },
        modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
        modalCancelBtn: { paddingHorizontal: 14, paddingVertical: 11 },
        modalCancelText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
        modalSaveBtn: {
          paddingHorizontal: 18,
          paddingVertical: 11,
          borderRadius: 10,
          backgroundColor: colors.primary,
          minWidth: 72,
          alignItems: 'center',
        },
        modalSaveBtnDisabled: { opacity: 0.5 },
        modalSaveText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },
        toastSuccess: {
          marginBottom: 12,
          padding: 12,
          borderRadius: 10,
          backgroundColor: isDark ? colors.bgElevated : '#ecfdf5',
          borderWidth: 1,
          borderColor: isDark ? colors.border : '#bbf7d0',
        },
        toastSuccessText: { fontSize: 14, color: isDark ? colors.text : '#166534', fontWeight: '600' },
      }),
    [colors, isDark],
  );

  function openNicknameModal() {
    setNicknameDraft(nickname?.trim() ?? '');
    setNicknameCheck('idle');
    setNicknameFormError(null);
    setNicknameModalOpen(true);
  }

  function closeNicknameModal() {
    if (nicknameSaving) return;
    setNicknameModalOpen(false);
  }

  async function handleCheckNickname() {
    setNicknameFormError(null);
    if (!isNicknameLengthValid(nicknameDraft)) {
      setNicknameCheck('error');
      setNicknameFormError(t.signup.invalidLength);
      return;
    }
    setNicknameCheck('checking');
    try {
      const ok = await checkNicknameAvailableForChange(nicknameDraft, nickname);
      setNicknameCheck(ok ? 'available' : 'taken');
      if (!ok) setNicknameFormError(t.signup.taken);
    } catch {
      setNicknameCheck('error');
      setNicknameFormError(t.settings.changeNicknameErrorUnknown);
    }
  }

  async function handleSaveNickname() {
    setNicknameFormError(null);
    setNicknameSuccess(null);
    const trimmed = nicknameDraft.trim();
    if (!isNicknameLengthValid(trimmed)) {
      setNicknameFormError(t.signup.invalidLength);
      return;
    }
    if (nickname?.trim() && trimmed.toLowerCase() === nickname.trim().toLowerCase()) {
      setNicknameFormError(t.settings.changeNicknameSame);
      return;
    }
    if (nicknameCheck !== 'available') {
      setNicknameFormError(nicknameCheck === 'taken' ? t.signup.taken : t.signup.needCheck);
      return;
    }

    setNicknameSaving(true);
    try {
      await updateMyNickname(trimmed);
      await refreshProfile();
      setNicknameModalOpen(false);
      setNicknameSuccess(t.settings.changeNicknameSuccess);
    } catch (err) {
      if (err instanceof NicknameUpdateError) {
        if (err.code === 'invalid_length') setNicknameFormError(t.signup.invalidLength);
        else if (err.code === 'nickname_taken') setNicknameFormError(t.signup.taken);
        else setNicknameFormError(t.settings.changeNicknameErrorUnknown);
      } else {
        setNicknameFormError(t.settings.changeNicknameErrorUnknown);
      }
    } finally {
      setNicknameSaving(false);
    }
  }

  useEffect(() => {
    if (!authPending && !userId) {
      router.replace('/');
    }
  }, [authPending, userId, router]);

  async function handleLogout() {
    await signOut();
    router.replace('/');
  }

  if (authPending || !userId) {
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
        {nicknameSuccess && (
          <View style={styles.toastSuccess}>
            <Text style={styles.toastSuccessText}>{nicknameSuccess}</Text>
          </View>
        )}

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
        </View>

        <Text style={styles.sectionHeading}>{t.settings.sectionMember}</Text>
        <View style={styles.card}>
          <Pressable style={styles.fieldRow} onPress={openNicknameModal} accessibilityRole="button">
            <Text style={styles.fieldLabel}>{t.settings.fieldName}</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.changeLink}>{t.settings.changeNickname}</Text>
          </Pressable>
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

      <Modal visible={nicknameModalOpen} transparent animationType="fade" onRequestClose={closeNicknameModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeNicknameModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t.settings.changeNicknameTitle}</Text>
            <Text style={styles.modalHint}>{t.settings.changeNicknameHint}</Text>
            <TextInput
              style={styles.modalInput}
              value={nicknameDraft}
              onChangeText={(text) => {
                setNicknameDraft(text);
                setNicknameCheck('idle');
                setNicknameFormError(null);
              }}
              placeholder={t.settings.nicknamePlaceholder}
              maxLength={16}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalCheckBtn}
                onPress={() => void handleCheckNickname()}
                disabled={nicknameCheck === 'checking'}
              >
                {nicknameCheck === 'checking' ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.modalCheckBtnText}>{t.signup.check}</Text>
                )}
              </Pressable>
            </View>
            {nicknameCheck === 'available' && !nicknameFormError && (
              <Text style={styles.modalHintOk}>{t.signup.available}</Text>
            )}
            {nicknameFormError && <Text style={styles.modalHintWarn}>{nicknameFormError}</Text>}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={closeNicknameModal} disabled={nicknameSaving}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveBtn, nicknameSaving && styles.modalSaveBtnDisabled]}
                onPress={() => void handleSaveNickname()}
                disabled={nicknameSaving}
              >
                {nicknameSaving ? (
                  <ActivityIndicator color={colors.primaryText} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>{t.settings.changeNicknameSave}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
