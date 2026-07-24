/**
 * GUCCI POP-UP 부티크 — m05 시안 참고 **프로시저럴** 레이아웃 (PNG 배경 없음).
 * docx 4-2: 등각 픽셀 매장, 마ble 바닥, 녹색 벽·진열, 중앙 디스플레이.
 */

export interface GucciDemoNpc {
  userId: string;
  username: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  lines: string[];
}

export type GucciFloorKind = 'marble' | 'marble_gg' | 'marble_dark';

export type GucciPropKind =
  | 'wall_gg'
  | 'wall_shelf'
  | 'round_display'
  | 'sofa'
  | 'showcase'
  | 'rack'
  | 'plant'
  | 'entrance';

export interface GucciPropPlacement {
  x: number;
  y: number;
  kind: GucciPropKind;
  collidable: boolean;
  /** 충돌 반경(타일) — 1이면 해당 칸만 */
  blockRadius?: number;
}

/** m05 시안 분위기 NPC — 닉네임 발 밑, 말풍선 타이머 */
export const GUCCI_DEMO_NPCS: GucciDemoNpc[] = [
  {
    userId: 'npc:luxelover',
    username: 'luxelover',
    x: 6,
    y: 12,
    direction: 'down',
    lines: ['GG 패턴 진짜 고급스러워요!', '와! 이 가방 예쁘다!'],
  },
  {
    userId: 'npc:stylist_ming',
    username: 'stylist_ming',
    x: 14,
    y: 11,
    direction: 'left',
    lines: ['여기 분위기 너무 좋아요', 'GG 패턴 멋져요!'],
  },
  {
    userId: 'npc:seoul_vibes',
    username: 'seoul_vibes',
    x: 10,
    y: 15,
    direction: 'up',
    lines: ['바로 구매각!', '다음에 또 올게요'],
  },
];

/** 시안 기준 가구·벽 배치 (20×20 그리드) */
export const GUCCI_PROPS: GucciPropPlacement[] = [
  { x: 2, y: 2, kind: 'wall_gg', collidable: true, blockRadius: 1 },
  { x: 5, y: 2, kind: 'wall_shelf', collidable: true, blockRadius: 1 },
  { x: 8, y: 2, kind: 'wall_shelf', collidable: true, blockRadius: 1 },
  { x: 11, y: 2, kind: 'wall_shelf', collidable: true, blockRadius: 1 },
  { x: 14, y: 2, kind: 'wall_shelf', collidable: true, blockRadius: 1 },
  { x: 17, y: 2, kind: 'wall_shelf', collidable: true, blockRadius: 1 },
  { x: 10, y: 8, kind: 'round_display', collidable: true, blockRadius: 2 },
  { x: 3, y: 7, kind: 'sofa', collidable: true, blockRadius: 1 },
  { x: 16, y: 9, kind: 'rack', collidable: true, blockRadius: 1 },
  { x: 17, y: 6, kind: 'showcase', collidable: true, blockRadius: 1 },
  { x: 5, y: 5, kind: 'plant', collidable: true, blockRadius: 1 },
  { x: 15, y: 5, kind: 'plant', collidable: true, blockRadius: 1 },
  { x: 10, y: 18, kind: 'entrance', collidable: false },
];

export function gucciFloorKindAt(x: number, y: number, mapW: number, mapH: number): GucciFloorKind {
  if (x <= 1 || y <= 1 || x >= mapW - 2 || y >= mapH - 2) return 'marble_dark';
  if ((x + y) % 5 === 0) return 'marble_gg';
  return 'marble';
}

export function isGucciBlockedTile(
  tileX: number,
  tileY: number,
  mapWidth: number,
  mapHeight: number
): boolean {
  const x = Math.round(tileX);
  const y = Math.round(tileY);
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return true;

  // 외곽 벽
  if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) return true;

  // 후면 벽 라인
  if (y === 1) return true;

  for (const prop of GUCCI_PROPS) {
    if (!prop.collidable) continue;
    const r = prop.blockRadius ?? 1;
    if (Math.abs(x - prop.x) <= r - 1 && Math.abs(y - prop.y) <= r - 1) return true;
  }

  return false;
}
