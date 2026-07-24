import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { useViewMode } from '../context/ViewModeContext';
import { useAuth } from '../context/AuthContext';
import { t, getAuthErrorMessage } from '../i18n';
import { checkNicknameAvailable, isNicknameLengthValid } from '../lib/nickname';

type Mode = 'login' | 'signup';
type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') === 'owner' ? 'owner' : 'shopper';
  const navigate = useNavigate();
  const { isMobile } = useViewMode();
  const { signInWithPassword, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    // 닉네임을 수정하면 이전 중복확인 결과는 무효 — 반드시 다시 확인해야 함.
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
      return;
    }
    navigate('/home');
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 중복확인을 안 눌렀거나(idle/checking/error), 눌렀는데 중복(taken)인 상태면 가입 자체를 막는다.
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

    navigate('/home');
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
    <div style={styles.page} className={isMobile ? 'page-mobile' : undefined}>
      <form
        style={styles.card}
        className="login-card"
        onSubmit={mode === 'login' ? handleLoginSubmit : handleSignupSubmit}
      >
        <h2 style={styles.title}>
          {role === 'owner' ? t('login.ownerTitle') : t('login.shopperTitle')}
        </h2>
        <p style={styles.subtitle}>
          {role === 'owner' ? t('login.ownerSubtitle') : t('login.shopperSubtitle')}
        </p>

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

        <button style={styles.button} type="submit" disabled={loading}>
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
          {t('common.back')}
        </button>

        <ViewModeToggle />
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
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  card: {
    background: '#0f3460',
    padding: '36px 32px',
    borderRadius: 16,
    width: 320,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  title: { color: '#fff', fontSize: 20, margin: 0 },
  subtitle: { color: '#a0a0c0', fontSize: 13, marginTop: 8, marginBottom: 8 },
  demoHint: {
    color: '#7dffb2',
    fontSize: 12,
    marginTop: 0,
    marginBottom: 16,
    background: '#173a2c',
    border: '1px solid #2c6b4a',
    borderRadius: 8,
    padding: '8px 10px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: 10,
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#16213e',
    color: '#fff',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  error: { color: '#ff6b6b', fontSize: 13, marginBottom: 10 },
  info: {
    color: '#8ce0b0',
    background: '#173a2c',
    border: '1px solid #2c6b4a',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 12,
    marginBottom: 12,
  },
  nicknameRow: { display: 'flex', gap: 8, marginBottom: 6 },
  nicknameInput: {
    flex: 1,
    padding: '12px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#16213e',
    color: '#fff',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  checkButton: {
    padding: '0 14px',
    borderRadius: 8,
    border: '1px solid #4062a0',
    background: '#203c70',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  hintOk: { color: '#8ce0b0', fontSize: 12, marginTop: 0, marginBottom: 10 },
  hintWarn: { color: '#ffb454', fontSize: 12, marginTop: 0, marginBottom: 10 },
  toggleButton: {
    width: '100%',
    padding: '8px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#8ea6dd',
    fontSize: 12,
    cursor: 'pointer',
    marginBottom: 2,
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 15,
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
    color: '#a0a0c0',
    fontSize: 13,
    cursor: 'pointer',
  },
};
