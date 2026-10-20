import type { OwnerSellerGuideFigureId } from '../lib/ownerSellerCenterGuideManifest';
import { OwnerSellerGuideScreenMock } from './ownerSellerGuideScreenMocks';

/** @deprecated SVG 제거 — 실제 판매자센터 CSS·문구 HTML 목업 (User 2026-10-20) */
export function OwnerSellerGuideFigure({ id }: { id: OwnerSellerGuideFigureId }) {
  return <OwnerSellerGuideScreenMock id={id} />;
}
