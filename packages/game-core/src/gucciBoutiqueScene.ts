import Phaser from 'phaser';
import {
  drawIsoFloorTile,
  drawGucciBackdrop,
  isoDepth,
  tileToIsoScreen,
  type IsoPoint,
} from './isoVisuals';
import {
  GUCCI_PROPS,
  gucciFloorKindAt,
  type GucciFloorKind,
  type GucciPropKind,
} from './gucciBoutiqueLayout';

const MARBLE = {
  marble: { top: 0xd8d0c4, left: 0xb8b0a4, right: 0xc8c0b4 },
  marble_gg: { top: 0xe4ddd2, left: 0xc4bdb2, right: 0xd4cdc2 },
  marble_dark: { top: 0xa8a098, left: 0x888078, right: 0x989088 },
};

function floorColors(kind: GucciFloorKind) {
  return MARBLE[kind];
}

function drawGgAccent(g: Phaser.GameObjects.Graphics, sx: number, sy: number) {
  g.lineStyle(1, 0xc9a962, 0.35);
  const s = 4;
  g.strokeRect(sx - s, sy + 8, s * 2, s * 2);
  g.beginPath();
  g.moveTo(sx - s, sy + 8);
  g.lineTo(sx + s, sy + 8 + s * 2);
  g.moveTo(sx + s, sy + 8);
  g.lineTo(sx - s, sy + 8 + s * 2);
  g.strokePath();
}

function drawWallGg(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 1);
  const g = scene.add.graphics().setDepth(d);
  g.fillStyle(0x0a4a38, 1);
  g.fillRect(sx - 28, sy - 52, 56, 48);
  g.fillStyle(0x062e24, 1);
  g.fillRect(sx - 28, sy - 4, 56, 8);
  scene.add
    .text(sx, sy - 28, 'GG', { fontSize: '18px', color: '#c9a962', fontStyle: 'bold' })
    .setOrigin(0.5)
    .setDepth(d + 1);
}

function drawWallShelf(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 1);
  const c = scene.add.container(sx, sy - 20).setDepth(d);
  const back = scene.add.rectangle(0, -18, 52, 44, 0x3d2818);
  const shelf1 = scene.add.rectangle(0, -28, 48, 4, 0xc9a962);
  const shelf2 = scene.add.rectangle(0, -14, 48, 4, 0xc9a962);
  const glow = scene.add.rectangle(0, -22, 44, 20, 0xffe8a0, 0.12);
  const bag1 = scene.add.rectangle(-12, -24, 12, 10, 0x1a1a1a);
  const bag2 = scene.add.rectangle(10, -12, 14, 11, 0x6b4a2f);
  c.add([back, glow, shelf1, shelf2, bag1, bag2]);
}

function drawRoundDisplay(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 8).setDepth(d);
  c.add(scene.add.ellipse(0, 6, 72, 28, 0x000000, 0.25));
  c.add(scene.add.ellipse(0, 0, 64, 32, 0x0d5c45));
  c.add(scene.add.ellipse(0, -4, 48, 24, 0x127a5a));
  c.add(scene.add.circle(0, -14, 10, 0xf5e6c8));
  c.add(scene.add.circle(0, -14, 6, 0xffb7c5));
  c.add(scene.add.rectangle(-14, -6, 12, 9, 0xc9a962));
  c.add(scene.add.rectangle(14, -4, 11, 8, 0x1a1a1a));
}

function drawSofa(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 6).setDepth(d);
  c.add(scene.add.ellipse(0, 8, 50, 16, 0x000000, 0.2));
  c.add(scene.add.rectangle(0, -4, 44, 18, 0x0a4a38));
  c.add(scene.add.rectangle(-18, -10, 10, 14, 0x084030));
  c.add(scene.add.rectangle(18, -10, 10, 14, 0x084030));
  c.add(scene.add.rectangle(0, 2, 36, 8, 0x6b4a2f));
}

function drawRack(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 10).setDepth(d);
  c.add(scene.add.rectangle(0, 0, 4, 38, 0xc9a962));
  c.add(scene.add.rectangle(0, -22, 40, 4, 0xc9a962));
  c.add(scene.add.rectangle(-10, -12, 14, 22, 0x0d5c45, 0.95));
  c.add(scene.add.rectangle(8, -10, 12, 20, 0x742438, 0.95));
}

function drawShowcase(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 8).setDepth(d);
  c.add(scene.add.rectangle(0, -6, 38, 28, 0x1a2744));
  c.add(scene.add.rectangle(0, -12, 32, 14, 0x88b4d8, 0.45));
  c.add(scene.add.rectangle(0, -10, 14, 10, 0xc9a962));
}

function drawPlant(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  const d = isoDepth(tx, ty, 2);
  const c = scene.add.container(sx, sy - 6).setDepth(d);
  c.add(scene.add.rectangle(0, 4, 16, 14, 0x4a3220));
  c.add(scene.add.circle(-6, -8, 10, 0x1a6b3a));
  c.add(scene.add.circle(6, -10, 9, 0x228844));
  c.add(scene.add.circle(0, -16, 8, 0x2a9955));
}

function drawEntrance(scene: Phaser.Scene, sx: number, sy: number, tx: number, ty: number) {
  scene.add
    .text(sx, sy - 8, 'GUCCI', {
      fontSize: '13px',
      color: '#c9a962',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(isoDepth(tx, ty, 1));
}

function drawProp(
  scene: Phaser.Scene,
  kind: GucciPropKind,
  sx: number,
  sy: number,
  tx: number,
  ty: number
) {
  switch (kind) {
    case 'wall_gg':
      drawWallGg(scene, sx, sy, tx, ty);
      break;
    case 'wall_shelf':
      drawWallShelf(scene, sx, sy, tx, ty);
      break;
    case 'round_display':
      drawRoundDisplay(scene, sx, sy, tx, ty);
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
    case 'entrance':
      drawEntrance(scene, sx, sy, tx, ty);
      break;
  }
}

/** m05 시안 톤 — 등각 타일 바닥 + 벽·가구 (PNG 없음) */
export function buildGucciBoutiqueScene(
  scene: Phaser.Scene,
  mapWidth: number,
  mapHeight: number,
  origin: IsoPoint
) {
  drawGucciBackdrop(scene, mapWidth * 80, mapHeight * 80);

  const floorG = scene.add.graphics().setDepth(0);
  for (let y = 0; y < mapHeight; y += 1) {
    for (let x = 0; x < mapWidth; x += 1) {
      const kind = gucciFloorKindAt(x, y, mapWidth, mapHeight);
      const screen = tileToIsoScreen(x, y, origin.x, origin.y);
      drawIsoFloorTile(floorG, screen.x, screen.y, floorColors(kind));
      if (kind === 'marble_gg') {
        drawGgAccent(floorG, screen.x, screen.y);
      }
    }
  }

  // 코너 벽 (m05 — 녹색 패널 + 나무)
  const wallG = scene.add.graphics().setDepth(1);
  for (let x = 1; x < mapWidth - 1; x += 1) {
    const p = tileToIsoScreen(x, 0, origin.x, origin.y);
    wallG.fillStyle(0x1a120c, 0.6);
    wallG.fillRect(p.x - 36, p.y - 8, 72, 12);
  }

  const sorted = [...GUCCI_PROPS].sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const prop of sorted) {
    const screen = tileToIsoScreen(prop.x, prop.y, origin.x, origin.y);
    drawProp(scene, prop.kind, screen.x, screen.y - 10, prop.x, prop.y);
  }
}
