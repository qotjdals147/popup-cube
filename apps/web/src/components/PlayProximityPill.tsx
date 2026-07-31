import { t } from '../i18n';

type PlayProximityPillProps = {
  label: string;
  onActivate: () => void;
};

/**
 * 진열·기타 interact zone 근접 안내 (옵션 C).
 * 짧은 가운데 알약 — 탭 = HUD 「상호작용」과 동일.
 */
export function PlayProximityPill({ label, onActivate }: PlayProximityPillProps) {
  return (
    <div className="play-proximity-anchor" aria-live="polite">
      <button type="button" className="play-proximity-pill" onClick={onActivate}>
        <span className="play-proximity-label">{label}</span>
        <span className="play-proximity-hint">{t('play.proximityTapHint')}</span>
      </button>
    </div>
  );
}
