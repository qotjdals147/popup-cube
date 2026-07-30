import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';

/** AD-037 — PC 웹: 스토어 관리자 로그인만 */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t('landing.title')}</h1>
        <p style={styles.subtitle}>{t('landing.subtitle')}</p>
        <p style={styles.tagline}>{t('landing.tagline')}</p>

        <button style={styles.primaryButton} onClick={() => navigate('/login')}>
          {t('landing.ownerButton')}
        </button>

        <p style={styles.appNote}>{t('landing.appNote')}</p>
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
    padding: '40px 32px',
    borderRadius: 16,
    textAlign: 'center',
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    margin: 0,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#d8e4ff',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: 500,
  },
  tagline: {
    color: '#a0a0c0',
    marginTop: 0,
    marginBottom: 28,
    fontSize: 13,
    lineHeight: 1.5,
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    borderRadius: 10,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  appNote: {
    color: '#8ea6dd',
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 20,
    marginBottom: 0,
  },
};
