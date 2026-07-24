/**
 * m05 시안 픽셀 아트 에셋 — 목업 PNG에서 추출한 배경·아바타 사용.
 * (프로시저럴 도형 그리기 / 시안과 다른 PNG 붙이기 아님)
 */

export const SIAN_WORLD = {
  interior: '/worlds/m05-interior.png',
  avatars: [
    '/worlds/avatars/avatar-0.png',
    '/worlds/avatars/avatar-1.png',
    '/worlds/avatars/avatar-2.png',
    '/worlds/avatars/avatar-3.png',
    '/worlds/avatars/avatar-4.png',
  ],
  /** m05-interior.png (682×728) 바닥 — 2:1 dimetric */
  tileWidth: 54,
  tileHeight: 27,
  originX: 341,
  originY: 218,
};

export interface SianDemoNpc {
  userId: string;
  username: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  avatarIndex: number;
  lines: string[];
}

export const SIAN_DEMO_NPCS: SianDemoNpc[] = [
  {
    userId: 'npc:luxelover',
    username: 'luxelover',
    x: 6,
    y: 12,
    direction: 'down',
    avatarIndex: 3,
    lines: ['GG 패턴 진짜 고급스러워요!', '와! 이 가방 예쁘다!'],
  },
  {
    userId: 'npc:stylist_ming',
    username: 'stylist_ming',
    x: 13,
    y: 11,
    direction: 'left',
    avatarIndex: 1,
    lines: ['여기 분위기 너무 좋아요', 'GG 패턴 멋져요!'],
  },
  {
    userId: 'npc:seoul_vibes',
    username: 'seoul_vibes',
    x: 10,
    y: 15,
    direction: 'up',
    avatarIndex: 2,
    lines: ['바로 구매각!', '다음에 또 올게요'],
  },
];

export function tileToSianScreen(tileX: number, tileY: number): { x: number; y: number } {
  const hw = SIAN_WORLD.tileWidth / 2;
  const hh = SIAN_WORLD.tileHeight / 2;
  return {
    x: (tileX - tileY) * hw + SIAN_WORLD.originX,
    y: (tileX + tileY) * hh + SIAN_WORLD.originY,
  };
}

export function sianDepth(tileX: number, tileY: number, layer = 0): number {
  return Math.floor((tileX + tileY) * 10 + layer);
}

/** m05 매장 바닥 walk + 가구 충돌 (대략) */
export function isSianBlockedTile(
  tileX: number,
  tileY: number,
  mapWidth: number,
  mapHeight: number
): boolean {
  const x = Math.round(tileX);
  const y = Math.round(tileY);
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return true;
  if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) return true;
  if (y === 1) return true;
  if (x >= 8 && x <= 11 && y >= 5 && y <= 9) return true;
  if (x <= 3 && y >= 5 && y <= 10) return true;
  if (x >= 16 && y >= 7) return true;
  if (x <= 4 && y <= 4) return true;
  if (x >= 17 && y >= 5 && y <= 8) return true;
  return false;
}

export function avatarIndexForUser(userId: string, isSelf: boolean): number {
  if (isSelf) return 0;
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) hash = (hash + userId.charCodeAt(i) * (i + 1)) % 997;
  return 1 + (hash % 4);
}
