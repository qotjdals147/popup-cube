import { useEffect, useRef, type ReactNode } from 'react';
import { CAROUSEL_DRAG_BODY_FLAG } from '../lib/carouselClickGuard';

interface ProductDetailInfiniteCarouselProps {
  children: ReactNode[];
  itemWidth: number;
  gap?: number;
  speedPxPerSec?: number;
  className?: string;
  ariaLabel?: string;
}

const HORIZONTAL_DRAG_THRESHOLD_PX = 10;
const HORIZONTAL_INTENT_RATIO = 1.15;
/**
 * 상품 상세 — 가로 무한 캐러셀 (자동 슬로우 + 카드 위에서도 가로 드래그).
 */
export function ProductDetailInfiniteCarousel({
  children,
  itemWidth,
  gap = 10,
  speedPxPerSec = 20,
  className = '',
  ariaLabel,
}: ProductDetailInfiniteCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
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

  const setDraggingFlag = (on: boolean) => {
    if (on) document.body.setAttribute(CAROUSEL_DRAG_BODY_FLAG, '1');
    else document.body.removeAttribute(CAROUSEL_DRAG_BODY_FLAG);
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

      if (!pausedRef.current && !dragActiveRef.current && speedPxPerSec > 0 && setWidth > 0 && count > 1) {
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

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      pendingRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startOffset: offsetRef.current,
      };
      dragActiveRef.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
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
        setDraggingFlag(true);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        viewport.setPointerCapture(e.pointerId);
      }

      e.preventDefault();
      offsetRef.current = pending.startOffset - dx;
      wrapOffset();
      applyTransform();
    };

    const finishPointer = (e: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || pending.pointerId !== e.pointerId) return;

      if (dragActiveRef.current) {
        try {
          viewport.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        pauseAuto();
        window.setTimeout(() => setDraggingFlag(false), 320);
      }

      pendingRef.current = null;
      dragActiveRef.current = false;
    };

    viewport.addEventListener('pointerdown', onPointerDown, { capture: true });
    viewport.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
    viewport.addEventListener('pointerup', finishPointer, { capture: true });
    viewport.addEventListener('pointercancel', finishPointer, { capture: true });

    return () => {
      viewport.removeEventListener('pointerdown', onPointerDown, { capture: true });
      viewport.removeEventListener('pointermove', onPointerMove, { capture: true });
      viewport.removeEventListener('pointerup', finishPointer, { capture: true });
      viewport.removeEventListener('pointercancel', finishPointer, { capture: true });
      setDraggingFlag(false);
    };
  }, [count, setWidth]);

  if (count === 0) return null;

  return (
    <div className={`product-detail-infinite-carousel ${className}`.trim()} aria-label={ariaLabel}>
      <div ref={viewportRef} className="product-detail-infinite-carousel__viewport">
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
