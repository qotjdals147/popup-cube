import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { t } from '../src/i18n/ko';
import {
  checkNicknameAvailable,
  isNicknameLengthValid,
} from '../src/lib/nickname';
import { colors } from '../src/theme/colors';
import { useRestoreSystemChromeOnFocus } from '../src/hooks/useWorldImmersiveChrome';

type Mode = 'login' | 'signup';
type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function LoginScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  useRestoreSystemChromeOnFocus();
  const isOwner = roleParam === 'owner';
  const { signInWithPassword, signUp, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError(null);
    setInfo(null);
    setPassword('');
    setNickname('');
    setNicknameStatus('idle');
  }

  async function handleCheckNickname() {
    if (!isNicknameLengthValid(nickname)) {
      setNicknameStatus('error');
      setError(t.signup.invalidLength);
      return;
    }
    setError(null);
    setNicknameStatus('checking');
    try {
      const available = await checkNicknameAvailable(nickname);
      setNicknameStatus(available ? 'available' : 'taken');
      if (!available) setError(t.signup.taken);
    } catch {
      setNicknameStatus('error');
      setError(t.signup.needCheck);
    }
  }

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signInWithPassword(email.trim(), password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.replace('/home');
  }

  async function handleSignup() {
    if (nicknameStatus !== 'available') {
      setError(t.signup.needCheck);
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signUpError, needsEmailConfirmation } = await signUp(
      email.trim(),
      password,
      nickname.trim()
    );
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    if (needsEmailConfirmation) {
      setInfo(t.signup.emailConfirm);
      return;
    }
    router.replace('/home');
  }

  const title = isOwner ? t.login.ownerTitle : t.login.shopperTitle;
  const subtitle = isOwner ? t.login.ownerSubtitle : t.login.shopperSubtitle;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {isOwner && <Text style={styles.hint}>{t.login.ownerPcHint}</Text>}

        {mode === 'signup' && (
          <>
            <Text style={styles.label}>{t.signup.nickname}</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                value={nickname}
                onChangeText={(v) => {
                  setNickname(v);
                  setNicknameStatus('idle');
                }}
                placeholder={t.signup.nicknamePlaceholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <Pressable style={styles.checkButton} onPress={handleCheckNickname}>
                <Text style={styles.checkButtonText}>
                  {nicknameStatus === 'checking' ? t.signup.checking : t.signup.check}
                </Text>
              </Pressable>
            </View>
            {nicknameStatus === 'available' && (
              <Text style={styles.ok}>{t.signup.available}</Text>
            )}
          </>
        )}

        <Text style={styles.label}>{t.login.email}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{t.login.password}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.textMuted}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <Pressable
          style={[styles.submit, (submitting || authLoading) && styles.submitDisabled]}
          disabled={submitting || authLoading}
          onPress={mode === 'login' ? handleLogin : handleSignup}
        >
          {submitting || authLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.submitText}>
              {mode === 'login' ? t.login.submit : t.signup.submit}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={toggleMode}>
          <Text style={styles.toggle}>
            {mode === 'login' ? t.login.toggleSignup : t.login.toggleLogin}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: colors.textSoft, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: 16 },
  label: { color: colors.textMuted, fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 8 },
  flexInput: { flex: 1 },
  checkButton: {
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkButtonText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  ok: { color: '#6ee7b7', fontSize: 13, marginTop: 6 },
  error: { color: '#fca5a5', marginTop: 12, fontSize: 14 },
  info: { color: colors.textSoft, marginTop: 12, fontSize: 14 },
  submit: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  toggle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
