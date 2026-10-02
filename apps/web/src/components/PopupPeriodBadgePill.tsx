import { getPopupPeriodBadge, type PopupPeriodTone } from '../lib/popupPeriod';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface PopupPeriodBadgePillProps {
  popupEndsAt: string | null | undefined;
}

export function PopupPeriodBadgePill({ popupEndsAt }: PopupPeriodBadgePillProps) {
  const period = getPopupPeriodBadge(popupEndsAt, {
    ended: t('ownerDashboard.periodEnded'),
    today: t('ownerDashboard.periodToday'),
    dDay: (n) => t('ownerDashboard.periodDDay', { n: String(n) }),
  });

  if (period.tone === 'none' || !period.label) return null;

  return <span style={pillStyle(period.tone)}>{period.label}</span>;
}

function pillStyle(tone: PopupPeriodTone): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: fs.xs,
    padding: '3px 8px',
    borderRadius: 999,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  };
  switch (tone) {
    case 'ended':
      return { ...base, background: '#868e96' };
    case 'today':
    case 'urgent':
      return { ...base, background: '#e94560' };
    case 'normal':
    default:
      return { ...base, background: '#1e4db7' };
  }
}
