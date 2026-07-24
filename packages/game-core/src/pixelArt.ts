import Phaser from 'phaser';

/** m05 시안 팔레트 — PNG가 아니라 그릴 때 참고하는 색 */
export const M05 = {
  woodDark: 0x1a1008,
  wood: 0x3d2818,
  woodHi: 0x5c4030,
  greenDeep: 0x062e24,
  green: 0x0a4a38,
  greenHi: 0x127a5a,
  velvet: 0x0d5c45,
  gold: 0xc9a962,
  goldDim: 0x8a7340,
  marble: 0xe4ddd2,
  marbleSh: 0xc8c0b4,
  marbleHi: 0xf8f4ec,
  skin: 0xffdcc8,
  hair: 0x2a1810,
  hair2: 0x1a1a2e,
  coat: 0xc9a962,
  coat2: 0x0d5c45,
  bag: 0x1a1a1a,
  bagTan: 0x8a6240,
  glass: 0x88c8e8,
  plant: 0x2a8844,
  plantHi: 0x44aa55,
  shadow: 0x000000,
  lamp: 0xffe8a0,
} as const;

export function drawPixelFigure(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  rows: readonly string[],
  palette: Record<string, number>,
  pixel = 2
): Phaser.GameObjects.Container {
  const c = scene.add.container(cx, cy);
  const g = scene.add.graphics();
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx += 1) {
      const ch = row[rx];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect((rx - row.length / 2) * pixel, (ry - rows.length) * pixel, pixel, pixel);
    }
  });
  c.add(g);
  return c;
}

export const CHIBI_A: readonly string[] = [
  '..HHHH..',
  '.HSSSSH.',
  'HSSSSSSH',
  '..SSSS..',
  '.CCCCCC.',
  '.CCCCCC.',
  '..CCCC..',
  '..CC....',
  '..CC....',
];

export const CHIBI_B: readonly string[] = [
  '..hh..',
  '.hSSh.',
  'hSSSSh',
  '.SSSS.',
  '.GGGG.',
  '.GGGG.',
  '..GG..',
  '..GG..',
  '..GG..',
];

export const CHIBI_C: readonly string[] = [
  '..HHHH..',
  '.HSSSSH.',
  'HSSSSSSH',
  '..SSSS..',
  '.KKKKKK.',
  '.KKGKKK.',
  '..KK....',
  '..KK....',
  '..KK....',
];

export function paletteSelf(): Record<string, number> {
  return { H: M05.hair, S: M05.skin, C: M05.coat, h: M05.hair2, G: M05.green, K: M05.coat };
}

export function paletteNpc(variant: number): Record<string, number> {
  if (variant === 1) {
    return { H: M05.hair2, S: M05.skin, C: M05.green, h: M05.hair2, G: M05.greenHi, K: M05.bagTan };
  }
  if (variant === 2) {
    return { H: M05.hair, S: M05.skin, C: M05.coat2, h: M05.hair, G: M05.velvet, K: M05.gold };
  }
  return { H: M05.hair, S: M05.skin, C: M05.bagTan, h: M05.hair2, G: M05.green, K: M05.coat };
}

export function chibiForVariant(v: number): readonly string[] {
  if (v === 1) return CHIBI_B;
  if (v === 2) return CHIBI_C;
  return CHIBI_A;
}

export function avatarVariantForUser(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) hash = (hash + userId.charCodeAt(i) * (i + 1)) % 997;
  return hash % 3;
}
