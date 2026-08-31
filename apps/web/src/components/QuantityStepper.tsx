import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  /** 표시용 최대 (예: 주문 수량) */
  maxLabel?: number;
  className?: string;
  compact?: boolean;
}

/** 수량 선택 — number input 대신 ± 버튼 (0→1 입력 시 01 표시 문제 방지) */
export function QuantityStepper({
  value,
  min = 0,
  max,
  onChange,
  disabled = false,
  maxLabel,
  className,
  compact = false,
}: QuantityStepperProps) {
  const clamped = Math.min(max, Math.max(min, value));

  function step(delta: number) {
    if (disabled) return;
    onChange(Math.min(max, Math.max(min, clamped + delta)));
  }

  const btnSize = compact ? 28 : 32;

  return (
    <div className={className} style={styles.wrap(compact)}>
      <button
        type="button"
        style={styles.btn(btnSize, disabled || clamped <= min)}
        onClick={() => step(-1)}
        disabled={disabled || clamped <= min}
        aria-label="수량 감소"
      >
        −
      </button>
      <span style={styles.value(compact)} aria-live="polite">
        {clamped}
      </span>
      <button
        type="button"
        style={styles.btn(btnSize, disabled || clamped >= max)}
        onClick={() => step(1)}
        disabled={disabled || clamped >= max}
        aria-label="수량 증가"
      >
        +
      </button>
      {maxLabel != null && <span style={styles.maxLabel}>/ {maxLabel}</span>}
    </div>
  );
}

const styles = {
  wrap: (compact: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: compact ? 4 : 6,
  }),
  btn: (size: number, faded: boolean): React.CSSProperties => ({
    width: size,
    height: size,
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: faded ? oc.surfaceMuted : oc.surface,
    color: faded ? oc.textMuted : oc.text,
    fontSize: fs.md,
    fontWeight: 600,
    lineHeight: 1,
    cursor: faded ? 'default' : 'pointer',
    fontFamily: ownerFont,
    padding: 0,
    flexShrink: 0,
  }),
  value: (compact: boolean): React.CSSProperties => ({
    minWidth: compact ? 24 : 28,
    textAlign: 'center',
    fontSize: compact ? fs.sm : fs.base,
    fontWeight: 600,
    fontFamily: ownerFont,
    color: oc.text,
  }),
  maxLabel: {
    marginLeft: 2,
    fontSize: fs.sm,
    color: oc.textMuted,
    fontFamily: ownerFont,
  },
};
