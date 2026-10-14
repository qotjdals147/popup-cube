/** 점주 업로드 — 영역 맞추기 없이 꽉 차게 쓰기 좋은 권장 픽셀 (HANDOFF §7.119) */

export const STORE_THUMBNAIL_PX = { width: 960, height: 720 } as const;
export const STORE_NEWS_CARD_PX = { width: 720, height: 720 } as const;
export const PRODUCT_CARD_IMAGE_PX = { width: 1080, height: 1080 } as const;
export const PRODUCT_DETAIL_BLOCK_MIN_WIDTH_PX = 1080;

export function formatPxSize(w: number, h: number): string {
  return `${w}×${h}px`;
}
