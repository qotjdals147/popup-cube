import { useViewMode } from '../context/ViewModeContext';
import { t } from '../i18n';

type ViewModeToggleProps = {
  className?: string;
};

export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const { isMobile, toggleViewMode } = useViewMode();

  return (
    <button
      type="button"
      className={className ?? 'view-mode-toggle'}
      onClick={toggleViewMode}
      aria-label={isMobile ? t('viewMode.switchToPc') : t('viewMode.switchToMobile')}
    >
      {isMobile ? t('viewMode.switchToPc') : t('viewMode.switchToMobile')}
    </button>
  );
}
