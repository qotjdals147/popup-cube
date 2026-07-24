/** Fake-isometric (2:1 dimetric) projection — grid logic stays cartesian; visuals only. */

export const ISO_TILE_WIDTH = 72;
export const ISO_TILE_HEIGHT = 36;

export const GUCCI_COLORS = {
  bg: 0x0b1020,
  carpet: 0x5c1a2e,
  carpetLight: 0x742438,
  carpetStripe: 0x1a6b4a,
  carpetStripeAlt: 0xb83232,
  wood: 0x6b4a2f,
  woodDark: 0x4a3220,
  stone: 0x4a5568,
  gold: 0xc9a962,
  green: 0x0d5c45,
  red: 0xa83240,
  mannequin: 0xe8dcc8,
  showcase: 0x1a2744,
  glass: 0x88b4d8,
  playerSelf: 0xe94560,
  playerOther: 0x3e7bfa,
  shadow: 0x000000,
} as const;

export interface IsoPoint {
  x: number;
  y: number;
}

export function tileToIsoScreen(tileX: number, tileY: number, originX: number, originY: number): IsoPoint {
  return {
    x: (tileX - tileY) * (ISO_TILE_WIDTH / 2) + originX,
    y: (tileX + tileY) * (ISO_TILE_HEIGHT / 2) + originY,
  };
}

export function getIsoMapOrigin(mapWidth: number, mapHeight: number, viewportWidth: number): IsoPoint {
  const mapPixelWidth = (mapWidth + mapHeight) * (ISO_TILE_WIDTH / 2);
  const originX = Math.max(ISO_TILE_WIDTH, (viewportWidth - mapPixelWidth) / 2 + mapHeight * (ISO_TILE_WIDTH / 2));
  const originY = ISO_TILE_HEIGHT * 2;
  return { x: originX, y: originY };
}

export function getIsoMapPixelBounds(
  mapWidth: number,
  mapHeight: number,
  originX: number,
  originY: number
): { width: number; height: number; minX: number; minY: number } {
  const corners = [
    tileToIsoScreen(0, 0, originX, originY),
    tileToIsoScreen(mapWidth - 1, 0, originX, originY),
    tileToIsoScreen(0, mapHeight - 1, originX, originY),
    tileToIsoScreen(mapWidth - 1, mapHeight - 1, originX, originY),
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs) - ISO_TILE_WIDTH;
  const maxX = Math.max(...xs) + ISO_TILE_WIDTH;
  const minY = Math.min(...ys) - ISO_TILE_HEIGHT;
  const maxY = Math.max(...ys) + ISO_TILE_HEIGHT * 4;
  return { width: maxX - minX, height: maxY - minY, minX, minY };
}

export function isoDepth(tileX: number, tileY: number, layer = 0): number {
  return (tileX + tileY) * 10 + layer;
}

export function floorColorsForTile(tileId: string): { top: number; left: number; right: number } {
  if (tileId.includes('stripe')) {
    const stripe = (Math.abs(tileId.length) % 2) === 0;
    return stripe
      ? { top: GUCCI_COLORS.carpetStripe, left: 0x084a38, right: 0x0a7055 }
      : { top: GUCCI_COLORS.carpetStripeAlt, left: 0x7a2230, right: GUCCI_COLORS.red };
  }
  if (tileId.includes('carpet')) {
    return { top: GUCCI_COLORS.carpetLight, left: GUCCI_COLORS.carpet, right: 0x3d1220 };
  }
  if (tileId.includes('wood')) {
    return { top: GUCCI_COLORS.wood, left: GUCCI_COLORS.woodDark, right: 0x8a6240 };
  }
  if (tileId.includes('stone')) {
    return { top: 0x5a6578, left: GUCCI_COLORS.stone, right: 0x3a4250 };
  }
  return { top: 0x2a3348, left: 0x1e2538, right: 0x151b2a };
}

/** Draw one isometric floor tile (diamond). */
export function drawIsoFloorTile(
  g: Phaser.GameObjects.Graphics,
  screenX: number,
  screenY: number,
  colors: { top: number; left: number; right: number }
) {
  const hw = ISO_TILE_WIDTH / 2;
  const hh = ISO_TILE_HEIGHT / 2;
  g.fillStyle(colors.left, 1);
  g.beginPath();
  g.moveTo(screenX, screenY);
  g.lineTo(screenX - hw, screenY + hh);
  g.lineTo(screenX, screenY + ISO_TILE_HEIGHT);
  g.lineTo(screenX + hw, screenY + hh);
  g.closePath();
  g.fillPath();

  g.fillStyle(colors.right, 1);
  g.beginPath();
  g.moveTo(screenX, screenY);
  g.lineTo(screenX + hw, screenY + hh);
  g.lineTo(screenX, screenY + ISO_TILE_HEIGHT);
  g.closePath();
  g.fillPath();

  g.fillStyle(colors.top, 1);
  g.beginPath();
  g.moveTo(screenX, screenY);
  g.lineTo(screenX + hw, screenY + hh);
  g.lineTo(screenX, screenY + ISO_TILE_HEIGHT);
  g.lineTo(screenX - hw, screenY + hh);
  g.closePath();
  g.fillPath();
}

export function drawIsoProp(
  scene: Phaser.Scene,
  tileX: number,
  tileY: number,
  assetId: string,
  screenX: number,
  screenY: number
): Phaser.GameObjects.Container {
  const container = scene.add.container(screenX, screenY);
  const depth = isoDepth(tileX, tileY, 2);
  container.setDepth(depth);

  const id = assetId.toLowerCase();
  const shadow = scene.add.ellipse(0, 8, 40, 14, GUCCI_COLORS.shadow, 0.35);
  container.add(shadow);

  if (id.includes('mannequin')) {
    const base = scene.add.rectangle(0, -4, 18, 28, GUCCI_COLORS.mannequin);
    base.setAngle(-8);
    const head = scene.add.circle(0, -24, 8, GUCCI_COLORS.mannequin);
    const shirt = scene.add.rectangle(0, -8, 22, 16, GUCCI_COLORS.green);
    const stripe = scene.add.rectangle(0, -8, 22, 4, GUCCI_COLORS.red);
    container.add([base, shirt, stripe, head]);
    if (id.includes('gg')) {
      const gg = scene.add.text(0, -8, 'GG', {
        fontSize: '10px',
        color: '#c9a962',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(gg);
    }
  } else if (id.includes('showcase') || id.includes('bag')) {
    const cabinet = scene.add.rectangle(0, -10, 36, 24, GUCCI_COLORS.showcase);
    const glass = scene.add.rectangle(0, -14, 30, 14, GUCCI_COLORS.glass, 0.55);
    const bag = scene.add.rectangle(0, -12, 14, 10, GUCCI_COLORS.gold);
    container.add([cabinet, glass, bag]);
  } else if (id.includes('table') || id.includes('display')) {
    const top = scene.add.rectangle(0, -16, 44, 10, GUCCI_COLORS.wood);
    const legL = scene.add.rectangle(-14, -4, 6, 18, GUCCI_COLORS.woodDark);
    const legR = scene.add.rectangle(14, -4, 6, 18, GUCCI_COLORS.woodDark);
    container.add([legL, legR, top]);
  } else if (id.includes('hanger') || id.includes('rack')) {
    const pole = scene.add.rectangle(0, -8, 4, 32, GUCCI_COLORS.gold);
    const bar = scene.add.rectangle(0, -22, 36, 4, GUCCI_COLORS.gold);
    const coat = scene.add.rectangle(-8, -14, 14, 20, GUCCI_COLORS.green, 0.9);
    container.add([pole, bar, coat]);
  } else {
    const box = scene.add.rectangle(0, -12, 28, 20, 0x20855c);
    container.add(box);
  }

  return container;
}

export function createIsoPlayerVisual(
  scene: Phaser.Scene,
  tileX: number,
  tileY: number,
  isSelf: boolean,
  isOwner: boolean
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const depth = isoDepth(tileX, tileY, 5);
  container.setDepth(depth);

  const shadow = scene.add.ellipse(0, 6, 34, 12, GUCCI_COLORS.shadow, 0.4);
  const body = scene.add.rectangle(0, -6, 20, 26, isSelf ? GUCCI_COLORS.playerSelf : GUCCI_COLORS.playerOther);
  body.setAngle(-6);
  const head = scene.add.circle(0, -22, 9, 0xffdcc8);
  const highlight = scene.add.rectangle(0, -8, 16, 6, 0xffffff, 0.15);
  container.add([shadow, body, highlight, head]);

  if (isOwner) {
    const crown = scene.add.text(-14, -30, '👑', { fontSize: '14px' }).setOrigin(0.5);
    container.add(crown);
  }

  return container;
}

export function drawGucciBackdrop(scene: Phaser.Scene, width: number, height: number) {
  const g = scene.add.graphics().setDepth(-100);
  g.fillGradientStyle(0x0b1020, 0x0b1020, 0x141c32, 0x141c32, 1);
  g.fillRect(0, 0, width * 4, height * 4);
  return { g };
}
