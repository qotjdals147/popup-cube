/**
 * GUCCI 월드 — 시안 `m05-world-mobile.png` (등각뷰) 배경 + 그리드 walk.
 * docx/PPT 기준: 탑뷰 diamond(`world-mockup-complete`)가 아니라 m05 등각 시안.
 */

export const GUCCI_WORLD_ASSET = '/worlds/gucci-boutique.png';

/** m05 크롭(682×728) 바닥에 맞춘 2:1 dimetric 투영 */
export const GUCCI_ISO = {
  tileWidth: 54,
  tileHeight: 27,
  /** 크롭 이미지 기준 — 마ble 바닥 중앙 상단 */
  originX: 341,
  originY: 210,
};

export interface GucciDemoNpc {
  userId: string;
  username: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  lines: string[];
}

/** 데모 채널 분위기 — 소켓 밖 로컬 NPC (닉네임 발 밑, 말풍선은 타이머) */
export const GUCCI_DEMO_NPCS: GucciDemoNpc[] = [
  {
    userId: 'npc:luxelover',
    username: 'luxelover',
    x: 5,
    y: 11,
    direction: 'down',
    lines: ['GG 패턴 진짜 고급스러워요!', '와! 이 가방 예쁘다!'],
  },
  {
    userId: 'npc:stylist_ming',
    username: 'stylist_ming',
    x: 13,
    y: 10,
    direction: 'left',
    lines: ['여기 분위기 너무 좋아요', 'GG 패턴 멋져요!'],
  },
  {
    userId: 'npc:seoul_vibes',
    username: 'seoul_vibes',
    x: 9,
    y: 14,
    direction: 'up',
    lines: ['바로 구매각!', '다음에 또 올게요'],
  },
];

export function tileToGucciIsoScreen(
  tileX: number,
  tileY: number,
  originX = GUCCI_ISO.originX,
  originY = GUCCI_ISO.originY
): { x: number; y: number } {
  const hw = GUCCI_ISO.tileWidth / 2;
  const hh = GUCCI_ISO.tileHeight / 2;
  return {
    x: (tileX - tileY) * hw + originX,
    y: (tileX + tileY) * hh + originY,
  };
}

export function gucciIsoDepth(tileX: number, tileY: number, layer = 0): number {
  return Math.floor((tileX + tileY) * 10 + layer);
}

/** 대략적 충돌 — 벽·진열·소파·중앙 테이블 등 (그리드 타일) */
export function isGucciBlockedTile(tileX: number, tileY: number, mapWidth: number, mapHeight: number): boolean {
  const x = Math.round(tileX);
  const y = Math.round(tileY);

  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return true;

  // 가장자리 벽
  if (x <= 0 || y <= 0 || x >= mapWidth - 1 || y >= mapHeight - 1) return true;

  // 후면 벽 선반
  if (y <= 2 && x >= 2 && x <= mapWidth - 3) return true;

  // 중앙 원형 테이블·화분
  if (x >= 8 && x <= 11 && y >= 5 && y <= 9) return true;

  // 좌측 소파·테이블
  if (x <= 3 && y >= 4 && y <= 10) return true;

  // 우측 거울·랙
  if (x >= mapWidth - 4 && y >= 7) return true;

  // 좌상단 GG 문
  if (x <= 4 && y <= 4) return true;

  // 우측 전면 쇼케이스
  if (x >= mapWidth - 3 && y >= 4 && y <= 8) return true;

  return false;
}
