/**
 * m05 시안 **구조·톤** 참고 — PNG/추출 스프라이트 없이 등각 픽셀 매장을 코드로 구성.
 */
import Phaser from 'phaser';
import {
  ISO_TILE_HEIGHT,
  ISO_TILE_WIDTH,
  isoDepth,
  tileToIsoScreen,
  type IsoPoint,
} from './isoVisuals';
import {
  CHIBI_A,
  M05,
  chibiForVariant,
  drawPixelFigure,
  paletteNpc,
  paletteSelf,
} from './pixelArt';

export interface M05Npc {
  userId: string;
  username: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  variant: number;
  lines: string[];
}

export const M05_NPCS: M05Npc[] = [
  {
    userId: 'npc:luxelover',
    username: 'luxelover',
    x: 6,
    y: 12,
    direction: 'down',
    variant: 1,
    lines: ['GG 패턴 진짜 고급스러워요!', '와! 이 가방 예쁘다!'],
  },
  {
    userId: 'npc:stylist_ming',
    username: 'stylist_ming',
    x: 14,
    y: 11,
    direction: 'left',
    variant: 2,
    lines: ['여기 분위기 너무 좋아요', 'GG 패턴 멋져요!'],
  },
  {
    userId: 'npc:seoul_vibes',
    username: 'seoul_vibes',
    x: 10,
    y: 15,
    direction: 'up',
    variant: 0,
    lines: ['바로 구매각!', '다음에 또 올게요'],
  },
];

type PropKind = 'door' | 'shelf' | 'round_table' | 'sofa' | 'rack' | 'showcase' | 'plant';

interface PropDef {
  x: number;
  y: number;
  kind: PropKind;
  blockR: number;
}

const PROPS: PropDef[] = [
  { x: 3, y: 3, kind: 'door', blockR: 1 },
  { x: 5, y: 2, kind: 'shelf', blockR: 1 },
  { x: 8, y: 2, kind: 'shelf', blockR: 1 },
  { x: 11, y: 2, kind: 'shelf', blockR: 1 },
  { x: 14, y: 2, kind: 'shelf', blockR: 1 },
  { x: 17, y: 2, kind: 'shelf', blockR: 1 },
  { x: 10, y: 7, kind: 'round_table', blockR: 2 },
  { x: 4, y: 8, kind: 'sofa', blockR: 1 },
  { x: 16, y: 9, kind: 'rack', blockR: 1 },
  { x: 17, y: 6, kind: 'showcase', blockR: 1 },
  { x: 6, y: 5, kind: 'plant', blockR: 1 },
  { x: 15, y: 5, kind: 'plant', blockR: 1 },
];

export function isM05BlockedTile(x: number, y: number, w: number, h: number): boolean {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= w || iy >= h) return true;
  if (ix === 0 || iy === 0 || ix === w - 1 || iy === h - 1) return true;
  if (iy <= 1) return true;
  for (const p of PROPS) {
    if (Math.abs(ix - p.x) < p.blockR && Math.abs(iy - p.y) < p.blockR) return true;
  }
  return false;
}

function drawMarbleTile(g: Phaser.GameObjects.Graphics, sx: number, sy: number, variant: number) {
  const hw = ISO_TILE_WIDTH / 2;
  const hh = ISO_TILE_HEIGHT / 2;
  const left = variant % 3 === 0 ? M05.marbleSh : M05.marble;
  const right = variant % 3 === 1 ? M05.marbleSh : M05.marble;

  g.fillStyle(left, 1);
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(sx - hw, sy + hh);
  g.lineTo(sx, sy + ISO_TILE_HEIGHT);
  g.lineTo(sx + hw, sy + hh);
  g.closePath();
  g.fillPath();

  g.fillStyle(right, 1);
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(sx + hw, sy + hh);
  g.lineTo(sx, sy + ISO_TILE_HEIGHT);
  g.closePath();
  g.fillPath();

  g.fillStyle(M05.marbleHi, 1);
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(sx + hw, sy + hh);
  g.lineTo(sx, sy + ISO_TILE_HEIGHT);
  g.lineTo(sx - hw, sy + hh);
  g.closePath();
  g.fillPath();
}

function drawWallPanel(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 1);
  const g = scene.add.graphics().setDepth(d);
  g.fillStyle(M05.woodDark, 1);
  g.fillRect(sx - 30, sy - 46, 60, 42);
  g.fillStyle(M05.wood, 1);
  g.fillRect(sx - 28, sy - 44, 56, 38);
  g.lineStyle(2, M05.goldDim, 1);
  g.strokeRect(sx - 28, sy - 44, 56, 38);
}

function drawShelf(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 22).setDepth(d);
  const g = scene.add.graphics();
  g.fillStyle(M05.woodDark, 1);
  g.fillRect(-26, -32, 52, 36);
  g.fillStyle(M05.lamp, 0.15);
  g.fillRect(-22, -28, 44, 24);
  g.fillStyle(M05.gold, 1);
  g.fillRect(-24, -26, 48, 3);
  g.fillRect(-24, -14, 48, 3);
  g.fillStyle(M05.bag, 1);
  g.fillRect(-18, -22, 12, 9);
  g.fillRect(4, -10, 14, 10);
  c.add(g);
}

function drawDoor(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 18).setDepth(d);
  const g = scene.add.graphics();
  g.fillStyle(M05.greenDeep, 1);
  g.fillRect(-22, -38, 44, 40);
  g.fillStyle(M05.green, 1);
  g.fillRect(-20, -36, 40, 36);
  g.lineStyle(2, M05.gold, 1);
  g.strokeRect(-20, -36, 40, 36);
  c.add(g);
  c.add(
    scene.add
      .text(0, -18, 'GG', { fontSize: '16px', color: '#c9a962', fontStyle: 'bold' })
      .setOrigin(0.5)
  );
}

function drawRoundTable(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 3);
  const c = scene.add.container(sx, sy - 6).setDepth(d);
  c.add(scene.add.ellipse(0, 10, 80, 28, M05.shadow, 0.25));
  c.add(scene.add.ellipse(0, 0, 72, 34, M05.velvet));
  c.add(scene.add.ellipse(0, -4, 54, 26, M05.greenHi));
  c.add(scene.add.circle(0, -16, 9, M05.plantHi));
  c.add(scene.add.rectangle(-16, -4, 12, 9, M05.bag));
  c.add(scene.add.rectangle(14, -2, 11, 8, M05.bagTan));
}

function drawSofa(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 4).setDepth(d);
  const g = scene.add.graphics();
  g.fillStyle(M05.velvet, 1);
  g.fillRect(-24, -16, 48, 20);
  g.fillRect(-28, -8, 8, 14);
  g.fillRect(20, -8, 8, 14);
  g.fillStyle(M05.wood, 1);
  g.fillRect(-12, 0, 24, 8);
  c.add(g);
}

function drawRack(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 10).setDepth(d);
  const g = scene.add.graphics();
  g.fillStyle(M05.gold, 1);
  g.fillRect(-2, -4, 4, 36);
  g.fillRect(-22, -28, 44, 4);
  g.fillStyle(M05.green, 0.95);
  g.fillRect(-14, -18, 14, 22);
  g.fillStyle(M05.coat2, 0.9);
  g.fillRect(2, -16, 12, 20);
  c.add(g);
}

function drawShowcase(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 8).setDepth(d);
  const g = scene.add.graphics();
  g.fillStyle(M05.woodDark, 1);
  g.fillRect(-20, -8, 40, 28);
  g.fillStyle(M05.glass, 0.45);
  g.fillRect(-16, -14, 32, 16);
  g.fillStyle(M05.bagTan, 1);
  g.fillRect(-8, -12, 14, 10);
  c.add(g);
}

function drawPlant(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 4).setDepth(d);
  c.add(scene.add.rectangle(0, 6, 14, 12, M05.wood));
  c.add(scene.add.circle(-6, -6, 10, M05.plant));
  c.add(scene.add.circle(6, -8, 9, M05.plantHi));
}

function drawProp(scene: Phaser.Scene, kind: PropKind, sx: number, sy: number, tx: number, ty: number) {
  switch (kind) {
    case 'door':
      drawDoor(scene, sx, sy, tx, ty);
      break;
    case 'shelf':
      drawShelf(scene, sx, sy, tx, ty);
      break;
    case 'round_table':
      drawRoundTable(scene, sx, sy, tx, ty);
      break;
    case 'sofa':
      drawSofa(scene, sx, sy, tx, ty);
      break;
    case 'rack':
      drawRack(scene, sx, sy, tx, ty);
      break;
    case 'showcase':
      drawShowcase(scene, sx, sy, tx, ty);
      break;
    case 'plant':
      drawPlant(scene, sx, sy, tx, ty);
      break;
  }
}

export function buildM05Boutique(scene: Phaser.Scene, mapW: number, mapH: number, origin: IsoPoint) {
  const bg = scene.add.graphics().setDepth(-100);
  bg.fillGradientStyle(0x0a0e18, 0x0a0e18, 0x121828, 0x121828, 1);
  bg.fillRect(origin.x - 800, origin.y - 200, 1600, 1200);

  const floorG = scene.add.graphics().setDepth(0);
  for (let y = 0; y < mapH; y += 1) {
    for (let x = 0; x < mapW; x += 1) {
      const p = tileToIsoScreen(x, y, origin.x, origin.y);
      drawMarbleTile(floorG, p.x, p.y, x + y);
    }
  }

  for (let x = 1; x < mapW - 1; x += 1) {
    const p = tileToIsoScreen(x, 1, origin.x, origin.y);
    drawWallPanel(scene, p.x, p.y - 8, x, 1);
  }

  const sorted = [...PROPS].sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const prop of sorted) {
    const p = tileToIsoScreen(prop.x, prop.y, origin.x, origin.y);
    drawProp(scene, prop.kind, p.x, p.y - 10, prop.x, prop.y);
  }

  const ent = tileToIsoScreen(Math.floor(mapW / 2), mapH - 2, origin.x, origin.y);
  scene.add
    .text(ent.x, ent.y, 'GUCCI', { fontSize: '13px', color: '#c9a962', fontStyle: 'bold' })
    .setOrigin(0.5)
    .setDepth(isoDepth(Math.floor(mapW / 2), mapH - 2, 1));
}

export function createM05Avatar(
  scene: Phaser.Scene,
  tx: number,
  ty: number,
  isSelf: boolean,
  variant: number
): Phaser.GameObjects.Container {
  const d = isoDepth(tx, ty, 5);
  const c = scene.add.container(0, 0).setDepth(d);
  c.add(scene.add.ellipse(0, 10, 28, 10, M05.shadow, 0.3));
  const fig = drawPixelFigure(
    scene,
    0,
    0,
    isSelf ? CHIBI_A : chibiForVariant(variant),
    isSelf ? paletteSelf() : paletteNpc(variant),
    2
  );
  c.add(fig);
  return c;
}
