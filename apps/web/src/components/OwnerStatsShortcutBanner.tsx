import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerStatsShortcutBannerProps {
  onOpenStats: () => void;
}

export function OwnerStatsShortcutBanner({ onOpenStats }: OwnerStatsShortcutBannerProps) {
  return (
    <div style={styles.banner}>
      <div style={styles.textBlock}>
        <strong style={styles.title}>{t('ownerStats.shortcutTitle')}</strong>
        <p style={styles.body}>{t('ownerStats.shortcutBody')}</p>
      </div>
      <button type="button" style={styles.button} onClick={onOpenStats}>
        {t('ownerStats.shortcutButton')}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    margin: '0 20px 16px',
    padding: '14px 16px',
    borderRadius: 10,
    border: `1px solid ${oc.primary}`,
    background: '#f0f7ff',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  textBlock: { flex: 1, minWidth: 200 },
  title: { display: 'block', fontSize: fs.sm, fontWeight: 700, color: oc.text, marginBottom: 4 },
  body: { margin: 0, fontSize: fs.sm, color: oc.textSecondary, lineHeight: 1.5 },
  button: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
