import type { CSSProperties } from 'react';
import { parseImageCropPercent, stylesForCroppedMedia, type ImageCropPercent } from '../lib/mediaCropDisplay';

interface CroppedSquareMediaProps {
  src: string;
  alt?: string;
  crop: ImageCropPercent | unknown | null | undefined;
  className?: string;
  imgClassName?: string;
  size?: number;
}

/** 1:1 카드 — JPEG(이미 잘린 파일) 또는 GIF+image_crop */
export function CroppedSquareMedia({
  src,
  alt = '',
  crop,
  className = '',
  imgClassName = '',
  size,
}: CroppedSquareMediaProps) {
  const parsed = parseImageCropPercent(crop);
  const wrapStyle: CSSProperties = size
    ? { width: size, height: size, position: 'relative', overflow: 'hidden' }
    : { width: '100%', height: '100%', position: 'relative', overflow: 'hidden' };

  if (!parsed) {
    return (
      <div className={className} style={wrapStyle}>
        <img src={src} alt={alt} className={imgClassName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div className={className} style={wrapStyle}>
      <img src={src} alt={alt} className={imgClassName} style={stylesForCroppedMedia(parsed)} />
    </div>
  );
}
