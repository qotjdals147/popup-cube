import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

/** AD-037 — 일반 회원 쇼핑·월드는 모바일 앱 전용 */
export function AppOnlyPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t('appOnly.title')}</h1>
        <p style={styles.body}>{t('appOnly.body')}</p>
        <p style={styles.hint}>{t('appOnly.hint')}</p>
        <button style={styles.button} type="button" onClick={() => navigate('/')}>
          {t('appOnly.backLanding')}
        </button>
        <button style={styles.ghostButton} type="button" onClick={handleLogout}>
          {t('common.logout')}
        </button>
      </div>
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
    padding: 24,
  },
  card: {
    background: '#0f3460',
    padding: '36px 32px',
    borderRadius: 16,
    textAlign: 'center',
    maxWidth: 400,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  title: { color: '#fff', fontSize: 20, margin: 0 },
  body: { color: '#d8e4ff', fontSize: 14, lineHeight: 1.6, marginTop: 16, marginBottom: 8 },
  hint: { color: '#a0a0c0', fontSize: 13, lineHeight: 1.5, marginBottom: 24 },
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
  ghostButton: {
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
