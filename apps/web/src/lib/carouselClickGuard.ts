export const CAROUSEL_DRAG_BODY_FLAG = 'data-carousel-dragging';

export function wasCarouselDragJustNow(): boolean {
  return document.body.hasAttribute(CAROUSEL_DRAG_BODY_FLAG);
}

export function guardCarouselClick(action: () => void): void {
  if (wasCarouselDragJustNow()) return;
  action();
}
