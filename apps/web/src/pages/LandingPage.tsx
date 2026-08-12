import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';

/** AD-037 — PC 웹: 스토어 관리자 로그인만 */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandBar} />
        <h1 style={styles.title}>{t('landing.title')}</h1>
        <p style={styles.subtitle}>{t('landing.subtitle')}</p>
        <p style={styles.tagline}>{t('landing.tagline')}</p>

        <button style={styles.primaryButton} type="button" onClick={() => navigate('/login')}>
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
    background: oc.pageBg,
    fontFamily: ownerFont,
    padding: 24,
  },
  card: {
    position: 'relative',
    background: oc.surface,
    padding: '36px 32px 32px',
    borderRadius: 12,
    textAlign: 'center',
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
  title: {
    color: oc.text,
    fontSize: fs.xxl,
    margin: '4px 0 0',
    letterSpacing: 0.5,
    fontWeight: 700,
  },
  subtitle: {
    color: oc.textSecondary,
    marginTop: 10,
    marginBottom: 8,
    fontSize: fs.md,
    fontWeight: 600,
  },
  tagline: {
    color: oc.textMuted,
    marginTop: 0,
    marginBottom: 28,
    fontSize: fs.sm,
    lineHeight: 1.55,
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: oc.primaryText,
    fontSize: fs.md,
    fontWeight: 600,
    cursor: 'pointer',
  },
  appNote: {
    color: oc.textMuted,
    fontSize: fs.xs,
    lineHeight: 1.55,
    marginTop: 20,
    marginBottom: 0,
  },
};
