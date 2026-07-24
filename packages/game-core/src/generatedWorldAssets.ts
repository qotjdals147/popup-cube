/**
 * GUCCI generated room — coordinate model (§43 HANDOFF)
 *
 * TWO LAYERS (정식에서도 동일 패턴):
 * 1. **Tile grid** (tx, ty) — Socket.io 이동·멀티플레이·충돌 판정의 논리 좌표 (20×20)
 * 2. **Room pixels** (px, py) — 1024×1536 PNG 위 발 위치; 2:1 dimetric 투영
 *
 *   px = (tx - ty) × (tileWidth/2) + originX
 *   py = (tx + ty) × (tileHeight/2) + originY
 *
 * 가구 충돌·상호작용은 **PNG 픽셀 영역**(ellipse/rect)으로 판정 — AI room 아트와 정합.
 * 정식: fixture footprint + walkability mask가 DB에서 내려와 이 pixel layer를 대체.
 */

export const GENERATED_ROOM_PX = { width: 1024, height: 1536 };

export const GENERATED_WORLD = {
  room: '/worlds/generated/gucci-iso-room-empty.png',
  avatars: [
    '/worlds/generated/gucci-avatar-chibi-1.png',
    '/worlds/generated/gucci-avatar-chibi-2.png',
  ],
  /** Anchored: table center tile (10,11) ↔ room pixel (554, 874) */
  tileWidth: 52,
  tileHeight: 26,
  originX: 580,
  originY: 601,
  avatarScale: 0.17,
  footLiftPx: 6,
  labelBelowFeetPx: 2,
  speechBubbleAboveFeetPx: 132,
  defaultSpawn: { x: 6, y: 18, direction: 'up' as const },
};

/** Room PNG — central round display table (ellipse). */
export const TABLE_PIXEL_ELLIPSE = {
  cx: 554,
  cy: 874,
  rx: 182,
  ry: 118,
};

/** Interact ring: just outside table, not on top. d = normalized ellipse distance² */
export const TABLE_INTERACT_INNER = 0.82;
export const TABLE_INTERACT_OUTER = 1.55;

/** Tight to sprite — leave marble lanes on sides/bottom */
const ARMCHAIR_RECT = { x1: 140, y1: 1010, x2: 290, y2: 1160 };
const COUNTER_RECT = { x1: 720, y1: 1055, x2: 940, y2: 1220 };
/** Walkable marble — symmetric extra space north/south of table */
const FLOOR_BOUNDS = { xMin: 75, xMax: 945, yMin: 620, yMax: 1280 };

export const GUCCI_CENTER_TABLE = {
  id: 'fixture_center_table',
  label: '중앙 디스플레이 테이블',
  center: { x: 10, y: 11 },
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

export const GENERATED_NPCS: GeneratedNpc[] = [
  {
    userId: 'npc:luxelover',
    username: 'luxelover',
    x: 8,
    y: 17,
    direction: 'right',
    avatarIndex: 1,
    lines: ['GG 패턴 진짜 고급스러워요!', '와! 이 가방 예쁘다!'],
  },
  {
    userId: 'npc:stylist_ming',
    username: 'stylist_ming',
    x: 17,
    y: 11,
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

function tableEllipseDistSq(px: number, py: number): number {
  const { cx, cy, rx, ry } = TABLE_PIXEL_ELLIPSE;
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return dx * dx + dy * dy;
}

export function isOnTablePixels(px: number, py: number): boolean {
  return tableEllipseDistSq(px, py) <= 1;
}

function inRect(px: number, py: number, r: typeof ARMCHAIR_RECT): boolean {
  return px >= r.x1 && px <= r.x2 && py >= r.y1 && py <= r.y2;
}

/** Tile foot point → room PNG; furniture = pixel regions, floor = open unless bounds. */
export function isGeneratedBlockedTile(
  tileX: number,
  tileY: number,
  mapWidth: number,
  mapHeight: number
): boolean {
  const x = Math.round(tileX);
  const y = Math.round(tileY);
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return true;

  const { x: px, y: py } = tileToGeneratedScreen(x, y);

  if (py < FLOOR_BOUNDS.yMin || py > FLOOR_BOUNDS.yMax) return true;
  if (px < FLOOR_BOUNDS.xMin || px > FLOOR_BOUNDS.xMax) return true;

  if (isOnTablePixels(px, py)) return true;
  if (inRect(px, py, ARMCHAIR_RECT)) return true;
  if (inRect(px, py, COUNTER_RECT)) return true;

  return false;
}

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

  return { x: 6, y: 18 };
}

/** Near table in PNG space (ring), never while standing on table. */
export function getGeneratedInteractZone(tileX: number, tileY: number): GeneratedInteractZone | null {
  const { x: px, y: py } = tileToGeneratedScreen(tileX, tileY);
  if (isOnTablePixels(px, py)) return null;
  const d = tableEllipseDistSq(px, py);
  if (d <= TABLE_INTERACT_INNER || d > TABLE_INTERACT_OUTER) return null;
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
