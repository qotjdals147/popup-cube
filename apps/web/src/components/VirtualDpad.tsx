import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import type { VirtualDirections } from '@popup-cube/game-core';

type VirtualDpadProps = {
  onDirectionChange: (dirs: VirtualDirections) => void;
  disabled?: boolean;
  /** PlayWorld 등 — CSS absolute(left) 충돌 없이 인라인으로 크게 표시 */
  embedded?: boolean;
};

const IDLE: VirtualDirections = { up: false, down: false, left: false, right: false };

export function VirtualDpad({
  onDirectionChange,
  disabled,
  embedded = false,
}: VirtualDpadProps) {
  const activeRef = useRef<VirtualDirections>({ ...IDLE });

  const releaseAll = useCallback(() => {
    activeRef.current = { ...IDLE };
    onDirectionChange(IDLE);
  }, [onDirectionChange]);

  useEffect(() => {
    if (disabled) releaseAll();
  }, [disabled, releaseAll]);

  useEffect(() => {
    const onBlur = () => releaseAll();
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [releaseAll]);

  function press(partial: Partial<VirtualDirections>) {
    if (disabled) return;
    const next = { ...IDLE, ...partial };
    activeRef.current = next;
    onDirectionChange(next);
  }

  function bind(dir: keyof VirtualDirections) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        press({ [dir]: true });
      },
      onPointerUp: () => releaseAll(),
      onPointerCancel: () => releaseAll(),
      onPointerLeave: (e: React.PointerEvent) => {
        if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
        releaseAll();
      },
    };
  }

  if (embedded) {
    const btn: CSSProperties = {
      width: 54,
      height: 54,
      borderRadius: '50%',
      border: '1px solid rgba(201,169,98,0.55)',
      background: 'rgba(10,14,26,0.88)',
      color: '#fff',
      fontSize: 18,
      touchAction: 'none',
      WebkitTapHighlightColor: 'transparent',
      opacity: disabled ? 0.4 : 1,
    };
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          touchAction: 'none',
          userSelect: 'none',
        }}
        aria-label="이동 버튼"
        onContextMenu={(e) => e.preventDefault()}
      >
        <button type="button" style={btn} {...bind('up')}>
          ▲
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" style={btn} {...bind('left')}>
            ◀
          </button>
          <span style={{ width: 14, height: 14 }} aria-hidden />
          <button type="button" style={btn} {...bind('right')}>
            ▶
          </button>
        </div>
        <button type="button" style={btn} {...bind('down')}>
          ▼
        </button>
      </div>
    );
  }

  return (
    <div
      className="virtual-dpad"
      aria-label="이동 버튼"
      onContextMenu={(e) => e.preventDefault()}
    >
      <button type="button" className="virtual-dpad-btn virtual-dpad-up" {...bind('up')}>
        ▲
      </button>
      <div className="virtual-dpad-row">
        <button type="button" className="virtual-dpad-btn virtual-dpad-left" {...bind('left')}>
          ◀
        </button>
        <span className="virtual-dpad-center" aria-hidden />
        <button type="button" className="virtual-dpad-btn virtual-dpad-right" {...bind('right')}>
          ▶
        </button>
      </div>
      <button type="button" className="virtual-dpad-btn virtual-dpad-down" {...bind('down')}>
        ▼
      </button>
    </div>
  );
}
