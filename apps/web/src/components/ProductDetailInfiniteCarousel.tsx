import { useEffect, useRef, type ReactNode } from 'react';

interface ProductDetailInfiniteCarouselProps {
  children: ReactNode[];
  itemWidth: number;
  gap?: number;
  /** 가로 자동 스크롤 속도 (px/s). 0이면 자동만 끔 */
  speedPxPerSec?: number;
  className?: string;
  ariaLabel?: string;
}

/** 세로 스크롤과 구분 — 이 거리 이상 가로로 움직여야 캐러셀 조작 */
const HORIZONTAL_DRAG_THRESHOLD_PX = 16;
/** 가로 이동이 세로보다 이만큼 커야 가로 드래그로 인정 */
const HORIZONTAL_INTENT_RATIO = 1.35;

/**
 * 상품 상세 — 가로 무한 캐러셀 (자동 슬로우 + 의도적 가로 드래그).
 * 세로로 상세를 내릴 때 살짝 닿는 것만으로는 멈추지 않는다.
 */
export function ProductDetailInfiniteCarousel({
  children,
  itemWidth,
  gap = 10,
  speedPxPerSec = 20,
  className = '',
  ariaLabel,
}: ProductDetailInfiniteCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragActiveRef = useRef(false);
  const pendingRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const count = children.length;
  const itemStride = itemWidth + gap;
  const setWidth = count * itemStride;
  const loopChildren = count > 0 ? [...children, ...children] : [];

  const applyTransform = () => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
  };

  const wrapOffset = () => {
    if (setWidth <= 0) return;
    while (offsetRef.current >= setWidth) offsetRef.current -= setWidth;
    while (offsetRef.current < 0) offsetRef.current += setWidth;
  };

  const pauseAuto = (ms = 2800) => {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, ms);
  };

  useEffect(() => {
    if (count === 0) return;

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      if (!pausedRef.current && speedPxPerSec > 0 && setWidth > 0 && count > 1) {
        offsetRef.current += speedPxPerSec * dt;
        wrapOffset();
      }

      applyTransform();
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [count, setWidth, speedPxPerSec]);

  useEffect(() => {
    offsetRef.current = 0;
    applyTransform();
  }, [count, itemWidth, gap]);

  if (count === 0) return null;

  return (
    <div className={`product-detail-infinite-carousel ${className}`.trim()} aria-label={ariaLabel}>
      <div
        className="product-detail-infinite-carousel__viewport"
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          const target = e.target as HTMLElement;
          if (target.closest('button, a, input, textarea, select')) return;

          pendingRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startOffset: offsetRef.current,
          };
          dragActiveRef.current = false;
        }}
        onPointerMove={(e) => {
          const pending = pendingRef.current;
          if (!pending || pending.pointerId !== e.pointerId) return;

          const dx = e.clientX - pending.startX;
          const dy = e.clientY - pending.startY;

          if (!dragActiveRef.current) {
            if (
              Math.abs(dx) < HORIZONTAL_DRAG_THRESHOLD_PX ||
              Math.abs(dx) < Math.abs(dy) * HORIZONTAL_INTENT_RATIO
            ) {
              return;
            }
            dragActiveRef.current = true;
            pausedRef.current = true;
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }

          offsetRef.current = pending.startOffset - dx;
          wrapOffset();
          applyTransform();
        }}
        onPointerUp={(e) => {
          const pending = pendingRef.current;
          if (!pending || pending.pointerId !== e.pointerId) return;

          if (dragActiveRef.current) {
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            pauseAuto();
          }

          pendingRef.current = null;
          dragActiveRef.current = false;
        }}
        onPointerCancel={() => {
          if (dragActiveRef.current) pauseAuto();
          pendingRef.current = null;
          dragActiveRef.current = false;
        }}
      >
        <div
          ref={trackRef}
          className="product-detail-infinite-carousel__track"
          style={{ gap: `${gap}px` }}
        >
          {loopChildren.map((child, i) => (
            <div
              key={i}
              className="product-detail-infinite-carousel__slot"
              style={{ width: itemWidth, flex: `0 0 ${itemWidth}px` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
