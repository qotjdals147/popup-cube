import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t, getAuthErrorMessage } from '../i18n';
import { checkNicknameAvailable, isNicknameLengthValid } from '../lib/nickname';
import { ownerColors as oc, ownerFont, ownerFontSize as fs, ownerInput } from '../styles/ownerAdminTheme';

type Mode = 'login' | 'signup';
type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

/** AD-037 — PC 웹 로그인: 스토어 관리자 전용 */
export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, signUp, userId, role, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !userId) return;
    if (role === 'shopper') {
      navigate('/home', { replace: true });
      return;
    }
    navigate('/home', { replace: true });
  }, [authLoading, userId, role, navigate]);

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError(null);
    setInfo(null);
    setPassword('');
    setNickname('');
    setNicknameStatus('idle');
  }

  function handleNicknameChange(value: string) {
    setNickname(value);
    setNicknameStatus('idle');
  }

  async function handleCheckNickname() {
    if (!isNicknameLengthValid(nickname)) {
      setNicknameStatus('error');
      setError(t('signup.invalidLength'));
      return;
    }
    setError(null);
    setNicknameStatus('checking');
    try {
      const available = await checkNicknameAvailable(nickname);
      setNicknameStatus(available ? 'available' : 'taken');
    } catch {
      setNicknameStatus('error');
      setError(t('signup.checkError'));
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signInWithPassword(email, password);
    setLoading(false);

    if (signInError) {
      setError(getAuthErrorMessage(signInError));
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (nicknameStatus !== 'available') {
      setError(nicknameStatus === 'taken' ? t('signup.taken') : t('signup.needCheck'));
      return;
    }

    setLoading(true);
    const { error: signUpError, needsEmailConfirmation } = await signUp(email, password, nickname.trim());
    setLoading(false);

    if (signUpError) {
      setError(getAuthErrorMessage(signUpError));
      return;
    }

    if (needsEmailConfirmation) {
      setInfo(t('signup.needEmailConfirmation'));
      setMode('login');
      setPassword('');
      return;
    }
  }

  const nicknameHint =
    nicknameStatus === 'checking'
      ? t('signup.checking')
      : nicknameStatus === 'available'
        ? t('signup.available')
        : nicknameStatus === 'taken'
          ? t('signup.taken')
          : null;

  return (
    <div style={styles.page}>
      <form
        style={styles.card}
        onSubmit={mode === 'login' ? handleLoginSubmit : handleSignupSubmit}
      >
        <div style={styles.brandBar} />
        <h2 style={styles.title}>{t('login.ownerTitle')}</h2>
        <p style={styles.subtitle}>{t('login.ownerSubtitle')}</p>
        <p style={styles.pcHint}>{t('login.ownerPcHint')}</p>

        {info && <p style={styles.info}>{info}</p>}

        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('common.email')}
        />
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('common.password')}
        />

        {mode === 'signup' && (
          <>
            <div style={styles.nicknameRow}>
              <input
                style={styles.nicknameInput}
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder={t('signup.nicknamePlaceholder')}
                maxLength={16}
              />
              <button
                style={styles.checkButton}
                type="button"
                onClick={handleCheckNickname}
                disabled={nicknameStatus === 'checking' || !nickname.trim()}
              >
                {t('signup.checkButton')}
              </button>
            </div>
            {nicknameHint && (
              <p style={nicknameStatus === 'available' ? styles.hintOk : styles.hintWarn}>
                {nicknameHint}
              </p>
            )}
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={loading || authLoading}>
          {mode === 'login'
            ? loading
              ? t('common.loggingIn')
              : t('common.login')
            : loading
              ? t('signup.submitting')
              : t('signup.submit')}
        </button>

        <button style={styles.toggleButton} type="button" onClick={toggleMode}>
          {mode === 'login' ? t('login.toggleToSignup') : t('login.toggleToLogin')}
        </button>

        <button style={styles.backButton} type="button" onClick={() => navigate('/')}>
          {t('login.backToLanding')}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: oc.pageBg,
    fontFamily: ownerFont,
    padding: 24,
  },
  card: {
    position: 'relative',
    background: oc.surface,
    padding: '32px 32px 28px',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadowMd,
    overflow: 'hidden',
  },
  brandBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: oc.sidebarBg,
  },
  title: { color: oc.text, fontSize: fs.xl, margin: '4px 0 0', fontWeight: 700 },
  subtitle: { color: oc.textSecondary, fontSize: fs.sm, marginTop: 8, marginBottom: 4, lineHeight: 1.5 },
  pcHint: {
    color: oc.textMuted,
    fontSize: fs.xs,
    marginTop: 0,
    marginBottom: 20,
    lineHeight: 1.5,
  },
  input: {
    ...ownerInput,
    width: '100%',
    padding: '12px',
    marginBottom: 10,
    fontSize: fs.base,
  },
  error: { color: oc.dangerText, fontSize: fs.sm, marginBottom: 10, lineHeight: 1.45 },
  info: {
    color: oc.successText,
    background: oc.successBg,
    border: `1px solid ${oc.successBorder}`,
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: fs.sm,
    marginBottom: 12,
    lineHeight: 1.45,
  },
  nicknameRow: { display: 'flex', gap: 8, marginBottom: 6 },
  nicknameInput: {
    ...ownerInput,
    flex: 1,
    padding: '12px',
    fontSize: fs.base,
  },
  checkButton: {
    padding: '0 14px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surfaceMuted,
    color: oc.text,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  hintOk: { color: oc.successText, fontSize: fs.sm, marginTop: 0, marginBottom: 10 },
  hintWarn: { color: oc.warningText, fontSize: fs.sm, marginTop: 0, marginBottom: 10 },
  toggleButton: {
    width: '100%',
    padding: '8px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: oc.primary,
    fontSize: fs.sm,
    cursor: 'pointer',
    marginBottom: 2,
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: oc.primaryText,
    fontSize: fs.base,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
  },
  backButton: {
    width: '100%',
    padding: '8px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: oc.textMuted,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
};
