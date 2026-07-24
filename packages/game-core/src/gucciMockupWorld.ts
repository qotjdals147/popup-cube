/** GUCCI 월드 — 시안 PNG(`world-mockup-complete.png`) 위를 그리드로 walk */

export const GUCCI_WORLD_ASSET = '/worlds/gucci-boutique.png';

/** 텍스처 대비 walkable floor 영역 (시안 GG 패턴 마름모 바닥 — 수동 보정) */
export const GUCCI_WALK_RECT_RATIO = {
  x: 0.08,
  y: 0.12,
  w: 0.84,
  h: 0.78,
};

export function tileToMockupScreen(
  tileX: number,
  tileY: number,
  mapWidth: number,
  mapHeight: number,
  textureWidth: number,
  textureHeight: number
): { x: number; y: number } {
  const r = GUCCI_WALK_RECT_RATIO;
  const maxX = Math.max(mapWidth - 1, 1);
  const maxY = Math.max(mapHeight - 1, 1);
  return {
    x: textureWidth * r.x + (tileX / maxX) * textureWidth * r.w,
    y: textureHeight * r.y + (tileY / maxY) * textureHeight * r.h,
  };
}

export function mockupDepth(tileX: number, tileY: number): number {
  return Math.floor((tileX + tileY) * 10);
}
