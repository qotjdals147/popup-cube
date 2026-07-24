/**
 * PDF 시안과 동일 파이프라인 — AI 생성 게임 에셋 (목업 PNG 통째 붙이기 아님).
 * GenerateImage로 room/avatar를 따로 생성 → Phaser에서 조립.
 */

export const GENERATED_WORLD = {
  room: '/worlds/generated/gucci-iso-room-empty.png',
  avatars: [
    '/worlds/generated/gucci-avatar-chibi-1.png',
    '/worlds/generated/gucci-avatar-chibi-2.png',
  ],
  /** 1024×1536 room — marble floor walk grid (2:1 dimetric) */
  tileWidth: 52,
  tileHeight: 26,
  originX: 512,
  originY: 600,
  avatarScale: 0.28,
  /** Open floor spawn — front-center, away from central table */
  defaultSpawn: { x: 10, y: 16, direction: 'up' as const },
};

export interface GeneratedNpc {
  userId: string;
  username: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  avatarIndex: number;
  lines: string[];
}

export const GENERATED_NPCS: GeneratedNpc[] = [
  {
    userId: 'npc:luxelover',
    username: 'luxelover',
    x: 12,
    y: 15,
    direction: 'left',
    avatarIndex: 1,
    lines: ['GG 패턴 진짜 고급스러워요!', '와! 이 가방 예쁘다!'],
  },
  {
    userId: 'npc:stylist_ming',
    username: 'stylist_ming',
    x: 8,
    y: 15,
    direction: 'right',
    avatarIndex: 0,
    lines: ['여기 분위기 너무 좋아요', 'GG 패턴 멋져요!'],
  },
  {
    userId: 'npc:seoul_vibes',
    username: 'seoul_vibes',
    x: 10,
    y: 17,
    direction: 'up',
    avatarIndex: 1,
    lines: ['바로 구매각!', '다음에 또 올게요'],
  },
];

export function tileToGeneratedScreen(tileX: number, tileY: number): { x: number; y: number } {
  const hw = GENERATED_WORLD.tileWidth / 2;
  const hh = GENERATED_WORLD.tileHeight / 2;
  return {
    x: (tileX - tileY) * hw + GENERATED_WORLD.originX,
    y: (tileX + tileY) * hh + GENERATED_WORLD.originY,
  };
}

export function generatedDepth(tileX: number, tileY: number, layer = 0): number {
  return Math.floor((tileX + tileY) * 10 + layer);
}

/** Furniture / wall blocks only — open marble floor stays walkable. */
export function isGeneratedBlockedTile(
  tileX: number,
  tileY: number,
  mapWidth: number,
  mapHeight: number
): boolean {
  const x = Math.round(tileX);
  const y = Math.round(tileY);
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return true;

  // Outer walls
  if (x <= 1 || y <= 1 || x >= mapWidth - 2 || y >= mapHeight - 2) return true;
  // Back wall (top of room)
  if (x + y <= 6) return true;

  // Central round display table
  if (x >= 9 && x <= 11 && y >= 10 && y <= 12) return true;

  // Left armchair + side table
  if (x <= 4 && y >= 14 && y <= 17) return true;

  // Right checkout counter + clothing rack
  if (x >= 15 && y >= 14) return true;

  // Wall-mounted shelf strips (not walkable)
  if (x <= 3 && y >= 5 && y <= 11) return true;
  if (x >= 16 && y >= 5 && y <= 12) return true;

  // Door alcove (top-left)
  if (x <= 5 && y <= 4) return true;

  return false;
}

/** Map arrow keys to isometric grid deltas (screen-aligned). */
export function generatedMovementDelta(
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean
): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  if (up) {
    dx -= 1;
    dy -= 1;
  }
  if (down) {
    dx += 1;
    dy += 1;
  }
  if (left) {
    dx -= 1;
    dy += 1;
  }
  if (right) {
    dx += 1;
    dy -= 1;
  }
  if (dx === 0 && dy === 0) return { dx: 0, dy: 0 };
  const len = Math.hypot(dx, dy);
  return { dx: dx / len, dy: dy / len };
}

export function directionFromGeneratedDelta(dx: number, dy: number): 'up' | 'down' | 'left' | 'right' {
  if (dx === 0 && dy === 0) return 'down';
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

export function avatarIndexForUser(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) h = (h + userId.charCodeAt(i) * (i + 1)) % 997;
  return h % GENERATED_WORLD.avatars.length;
}
