/**
 * §44 Grid Occupancy — tile walkability + fixture multi-tile footprint.
 * Used by owner editor (overlap check) and Phaser world (canWalk).
 */

export interface TileCell {
  walkable: boolean;
  occupied: boolean;
  fixtureId?: string;
}

export interface TileSize {
  w: number;
  d: number;
}

export interface FixturePlacement {
  id: string;
  templateId: string;
  origin: { x: number; y: number };
  size: TileSize;
  rotation?: 0 | 90 | 180 | 270;
  slotCount?: number;
  label?: string | null;
}

export interface BuildOccupancyGridOptions {
  width: number;
  height: number;
  /** Tiles outside map bounds are treated as blocked. Default: all in-bounds walkable. */
  walkableMask?: boolean[][];
  /** Explicit non-walkable tiles (walls, blueprint). Applied after mask. */
  blockedTiles?: Array<{ x: number; y: number }>;
}

export interface OccupancyGridResult {
  grid: TileCell[][];
  width: number;
  height: number;
}

/** Swap w×d when rotated 90° or 270°. */
export function effectiveFixtureSize(size: TileSize, rotation: 0 | 90 | 180 | 270 = 0): TileSize {
  if (rotation === 90 || rotation === 270) {
    return { w: size.d, d: size.w };
  }
  return { w: size.w, d: size.d };
}

export function createEmptyGrid(width: number, height: number, defaultWalkable = true): TileCell[][] {
  const grid: TileCell[][] = [];
  for (let x = 0; x < width; x++) {
    grid[x] = [];
    for (let y = 0; y < height; y++) {
      grid[x][y] = { walkable: defaultWalkable, occupied: false };
    }
  }
  return grid;
}

function inBounds(grid: TileCell[][], x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < grid.length && y < grid[0].length;
}

export function applyWalkabilityMask(
  grid: TileCell[][],
  walkableMask?: boolean[][]
): void {
  if (!walkableMask) return;
  const width = grid.length;
  const height = grid[0]?.length ?? 0;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const row = walkableMask[x];
      if (!row || row[y] === false) {
        grid[x][y].walkable = false;
      }
    }
  }
}

export function setBlockedTiles(grid: TileCell[][], tiles: Array<{ x: number; y: number }>): void {
  for (const { x, y } of tiles) {
    if (inBounds(grid, x, y)) {
      grid[x][y].walkable = false;
    }
  }
}

export function occupyFixture(grid: TileCell[][], fixture: FixturePlacement): void {
  const rot = fixture.rotation ?? 0;
  const { w, d } = effectiveFixtureSize(fixture.size, rot);
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < d; dy++) {
      const x = fixture.origin.x + dx;
      const y = fixture.origin.y + dy;
      if (!inBounds(grid, x, y)) continue;
      grid[x][y].occupied = true;
      grid[x][y].fixtureId = fixture.id;
    }
  }
}

export function buildOccupancyGrid(
  options: BuildOccupancyGridOptions,
  fixtures: FixturePlacement[] = []
): OccupancyGridResult {
  const { width, height } = options;
  const grid = createEmptyGrid(width, height, true);
  applyWalkabilityMask(grid, options.walkableMask);
  if (options.blockedTiles?.length) {
    setBlockedTiles(grid, options.blockedTiles);
  }
  for (const fixture of fixtures) {
    occupyFixture(grid, fixture);
  }
  return { grid, width, height };
}

export function canWalk(grid: TileCell[][], tx: number, ty: number): boolean {
  if (!inBounds(grid, tx, ty)) return false;
  const cell = grid[tx][ty];
  return cell.walkable && !cell.occupied;
}

/** South-east corner tile for Y-sort anchor (§44.6). */
export function fixtureDepthAnchor(fixture: FixturePlacement): { x: number; y: number } {
  const rot = fixture.rotation ?? 0;
  const { w, d } = effectiveFixtureSize(fixture.size, rot);
  return {
    x: fixture.origin.x + w - 1,
    y: fixture.origin.y + d - 1,
  };
}

export function fixtureSortDepth(fixture: FixturePlacement, layer = 0): number {
  const anchor = fixtureDepthAnchor(fixture);
  return (anchor.x + anchor.y) * 1000 + layer;
}

export function getFixtureAt(grid: TileCell[][], tx: number, ty: number): string | undefined {
  if (!inBounds(grid, tx, ty)) return undefined;
  return grid[tx][ty].fixtureId;
}

/** True if fixture footprint fits entirely on walkable, unoccupied tiles (ignore self when moving). */
export function canPlaceFixture(
  grid: TileCell[][],
  fixture: FixturePlacement,
  ignoreFixtureId?: string
): boolean {
  const rot = fixture.rotation ?? 0;
  const { w, d } = effectiveFixtureSize(fixture.size, rot);
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < d; dy++) {
      const x = fixture.origin.x + dx;
      const y = fixture.origin.y + dy;
      if (!inBounds(grid, x, y)) return false;
      const cell = grid[x][y];
      if (!cell.walkable) return false;
      if (cell.occupied && cell.fixtureId !== ignoreFixtureId) return false;
    }
  }
  return true;
}

/** Adjacent walkable tiles around fixture bbox — for interact proximity (§44.5). */
export function fixtureInteractRing(
  fixture: FixturePlacement,
  mapWidth: number,
  mapHeight: number
): Array<{ x: number; y: number }> {
  const rot = fixture.rotation ?? 0;
  const { w, d } = effectiveFixtureSize(fixture.size, rot);
  const minX = fixture.origin.x - 1;
  const maxX = fixture.origin.x + w;
  const minY = fixture.origin.y - 1;
  const maxY = fixture.origin.y + d;
  const ring: Array<{ x: number; y: number }> = [];
  const seen = new Set<string>();

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const onEdge = x === minX || x === maxX || y === minY || y === maxY;
      if (!onEdge) continue;
      if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) continue;
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      ring.push({ x, y });
    }
  }
  return ring;
}

export function isAdjacentToFixture(
  playerX: number,
  playerY: number,
  fixture: FixturePlacement,
  mapWidth: number,
  mapHeight: number
): boolean {
  return fixtureInteractRing(fixture, mapWidth, mapHeight).some(
    (t) => t.x === playerX && t.y === playerY
  );
}
