import { useCallback, useEffect, useRef } from 'react';
import type { VirtualDirections } from '@popup-cube/game-core';

type VirtualDpadProps = {
  onDirectionChange: (dirs: VirtualDirections) => void;
  disabled?: boolean;
};

const IDLE: VirtualDirections = { up: false, down: false, left: false, right: false };

export function VirtualDpad({ onDirectionChange, disabled }: VirtualDpadProps) {
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
