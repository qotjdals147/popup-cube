import type { CSSProperties } from 'react';
import type { Area } from 'react-easy-crop';

/** react-easy-crop `onCropComplete` 첫 번째 인자(%) — GIF 등 원본 유지용 */
export type ImageCropPercent = Area;

export function parseImageCropPercent(raw: unknown): ImageCropPercent | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const x = Number(o.x);
  const y = Number(o.y);
  const width = Number(o.width);
  const height = Number(o.height);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

/** 정사각 카드 안에 cropPercent 구간만 보이게 (GIF 애니메이션 유지) */
export function stylesForCroppedMedia(crop: ImageCropPercent): CSSProperties {
  return {
    position: 'absolute',
    top: `${-(crop.y / crop.height) * 100}%`,
    left: `${-(crop.x / crop.width) * 100}%`,
    width: `${(100 / crop.width) * 100}%`,
    height: `${(100 / crop.height) * 100}%`,
    maxWidth: 'none',
    maxHeight: 'none',
    pointerEvents: 'none',
  };
}
