import { useNavigate } from 'react-router-dom';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { useViewMode } from '../context/ViewModeContext';
import { t } from '../i18n';

export function LandingPage() {
  const navigate = useNavigate();
  const { isMobile } = useViewMode();

  return (
    <div style={styles.page} className={isMobile ? 'page-mobile' : undefined}>
      <div style={styles.card} className="landing-card">
        <h1 style={styles.title}>{t('landing.title')}</h1>
        <p style={styles.subtitle}>{t('landing.subtitle')}</p>
        <p style={styles.tagline}>{t('landing.tagline')}</p>

        <button style={styles.primaryButton} onClick={() => navigate('/login?role=shopper')}>
          {t('landing.shopButton')} <span style={styles.hint}>{t('landing.shopHint')}</span>
        </button>

        <button style={styles.secondaryButton} onClick={() => navigate('/login?role=owner')}>
          {t('landing.ownerButton')} <span style={styles.hint}>{t('landing.ownerHint')}</span>
        </button>

        <ViewModeToggle />
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
  },
  card: {
    background: '#0f3460',
    padding: '40px 32px',
    borderRadius: 16,
    textAlign: 'center',
    width: 320,
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
    marginBottom: 32,
    fontSize: 13,
    lineHeight: 1.5,
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    marginBottom: 12,
    borderRadius: 10,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    width: '100%',
    padding: '14px',
    borderRadius: 10,
    border: '1px solid #e94560',
    background: 'transparent',
    color: '#e94560',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: 400,
  },
};
