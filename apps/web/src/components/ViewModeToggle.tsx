import { useViewMode } from '../context/ViewModeContext';
import { t } from '../i18n';

type ViewModeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ViewModeToggle({ className, compact }: ViewModeToggleProps) {
  const { isMobile, toggleViewMode } = useViewMode();

  return (
    <button
      type="button"
      className={
        className ?? (compact ? 'view-mode-toggle-compact' : 'view-mode-toggle')
      }
      onClick={toggleViewMode}
      aria-label={isMobile ? t('viewMode.switchToPc') : t('viewMode.switchToMobile')}
    >
      {isMobile ? t('viewMode.switchToPc') : t('viewMode.switchToMobile')}
    </button>
  );
}
