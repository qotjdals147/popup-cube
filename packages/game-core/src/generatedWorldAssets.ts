/**
 * PDF 시안과 동일 파이프라인 — AI 생성 게임 에셋 (목업 PNG 통째 붙이기 아님).
 * 2:1 dimetric tile grid — room PNG(1024×1536)에 앵커 보정.
 */

export const GENERATED_WORLD = {
  room: '/worlds/generated/gucci-iso-room-empty.png',
  avatars: [
    '/worlds/generated/gucci-avatar-chibi-1.png',
    '/worlds/generated/gucci-avatar-chibi-2.png',
  ],
  /** Calibrated: table center tile (10,11) ≈ pixel (512, 885) in room PNG */
  tileWidth: 52,
  tileHeight: 26,
  originX: 538,
  originY: 612,
  avatarScale: 0.17,
  footLiftPx: 6,
  labelBelowFeetPx: 2,
  speechBubbleAboveFeetPx: 132,
  /** Front-left marble — verified walkable (not x=16 counter edge) */
  defaultSpawn: { x: 8, y: 17, direction: 'up' as const },
};

/** Central display table — interact when adjacent, never stand on top. */
export const GUCCI_CENTER_TABLE = {
  id: 'fixture_center_table',
  label: '중앙 디스플레이 테이블',
  center: { x: 10, y: 11 },
  /** Chebyshev distance from center; player must be outside table footprint */
  interactRadius: 3,
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

/** NPCs on open front marble — y≥17 keeps clear of table footprint (y≤14). */
export const GENERATED_NPCS: GeneratedNpc[] = [
  {
    userId: 'npc:luxelover',
    username: 'luxelover',
    x: 6,
    y: 17,
    direction: 'right',
    avatarIndex: 1,
    lines: ['GG 패턴 진짜 고급스러워요!', '와! 이 가방 예쁘다!'],
  },
  {
    userId: 'npc:stylist_ming',
    username: 'stylist_ming',
    x: 13,
    y: 17,
    direction: 'left',
    avatarIndex: 0,
    lines: ['여기 분위기 너무 좋아요', 'GG 패턴 멋져요!'],
  },
  {
    userId: 'npc:seoul_vibes',
    username: 'seoul_vibes',
    x: 10,
    y: 18,
    direction: 'up',
    avatarIndex: 1,
    lines: ['바로 구매각!', '다음에 또 올게요'],
  },
];

export interface GeneratedInteractZone {
  id: string;
  label: string;
}

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

/** Table footprint in tile space — matches visual round display in room PNG. */
export function isGeneratedTableTile(tileX: number, tileY: number): boolean {
  const x = Math.round(tileX);
  const y = Math.round(tileY);
  return x >= 8 && x <= 12 && y >= 9 && y <= 14;
}

/** Only furniture + walls — all other tiles are walkable marble floor. */
export function isGeneratedBlockedTile(
  tileX: number,
  tileY: number,
  mapWidth: number,
  mapHeight: number
): boolean {
  const x = Math.round(tileX);
  const y = Math.round(tileY);
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return true;

  if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) return true;
  if (x + y <= 5) return true;

  if (isGeneratedTableTile(x, y)) return true;

  if (x >= 2 && x <= 4 && y >= 16 && y <= 18) return true;
  if (x >= 17 && y >= 15) return true;
  if (x <= 2 && y >= 4 && y <= 8) return true;
  if (x >= 18 && y >= 4 && y <= 9) return true;
  if (x <= 4 && y <= 3) return true;

  return false;
}

/** BFS — prefer spawn near (prefX, prefY) that is not blocked. */
export function findGeneratedWalkableTile(
  prefX: number,
  prefY: number,
  mapWidth: number,
  mapHeight: number
): { x: number; y: number } {
  const startX = Math.round(prefX);
  const startY = Math.round(prefY);
  if (!isGeneratedBlockedTile(startX, startY, mapWidth, mapHeight)) {
    return { x: startX, y: startY };
  }

  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const seen = new Set<string>([`${startX},${startY}`]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (!isGeneratedBlockedTile(cur.x, cur.y, mapWidth, mapHeight)) {
      return { x: cur.x, y: cur.y };
    }
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return { x: 8, y: 17 };
}

export function getGeneratedInteractZone(tileX: number, tileY: number): GeneratedInteractZone | null {
  const x = tileX;
  const y = tileY;
  const { center, interactRadius } = GUCCI_CENTER_TABLE;
  const dist = Math.max(Math.abs(x - center.x), Math.abs(y - center.y));
  if (dist > interactRadius) return null;
  if (isGeneratedTableTile(x, y)) return null;
  return { id: GUCCI_CENTER_TABLE.id, label: GUCCI_CENTER_TABLE.label };
}

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

export function generatedLabelY(tileX: number, tileY: number): number {
  return tileToGeneratedScreen(tileX, tileY).y + GENERATED_WORLD.labelBelowFeetPx;
}

export function generatedSpeechBubbleY(tileX: number, tileY: number): number {
  return tileToGeneratedScreen(tileX, tileY).y - GENERATED_WORLD.speechBubbleAboveFeetPx;
}

export function avatarIndexForUser(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) h = (h + userId.charCodeAt(i) * (i + 1)) % 997;
  return h % GENERATED_WORLD.avatars.length;
}
