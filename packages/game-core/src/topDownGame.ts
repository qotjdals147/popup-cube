import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  type ChannelInfo,
  type MapConfig,
  type PlayerState,
  type StoreJoinResponse,
} from '@popup-cube/shared';
import { createGameSocket, joinStore } from './socketClient';
import {
  createIsoPlayerVisual,
  drawGucciBackdrop,
  drawIsoFloorTile,
  drawIsoProp,
  floorColorsForTile,
  getIsoMapOrigin,
  getIsoMapPixelBounds,
  isoDepth,
  tileToIsoScreen,
  type IsoPoint,
} from './isoVisuals';
import { DEMO_STORE_ID } from '@popup-cube/shared';
import {
  avatarIndexForUser,
  directionFromGeneratedDelta,
  GENERATED_NPCS,
  GENERATED_WORLD,
  generatedDepth,
  generatedMovementDelta,
  generatedLabelY,
  generatedSpeechBubbleY,
  findGeneratedWalkableTile,
  getGeneratedInteractZone,
  isGeneratedBlockedTile,
  tileToGeneratedScreen,
  type GeneratedInteractZone,
  type GeneratedNpc,
} from './generatedWorldAssets';
import {
  canWalk,
  effectiveFixtureSize,
  fixtureInteractRing,
  type FixturePlacement,
  type OccupancyGridResult,
} from './occupancyGrid';

export type { GeneratedInteractZone } from './generatedWorldAssets';
export type { FixturePlacement } from './occupancyGrid';

// 타일/캐릭터/글자가 전체적으로 작아 보인다는 피드백 반영 — 타일 크기를 키우고,
// 지도 전체를 억지로 화면에 눌러 담는 대신 "고정된 카메라 창"만 보여준 뒤 캐릭터를 따라다니게 함.
const DEFAULT_TILE_SIZE = 56; // top-down tile px
const VIEWPORT_WIDTH_PX = 800;
const VIEWPORT_HEIGHT_PX = 520;
const GUCCI_VIEWPORT_WIDTH_PX = 960;
const GUCCI_VIEWPORT_HEIGHT_PX = 560;

export type WorldVisualStyle = 'top-down' | 'iso-fake' | 'generated';

function resolveVisualStyle(storeId: string, override?: WorldVisualStyle): WorldVisualStyle {
  if (override) return override;
  return storeId === DEMO_STORE_ID ? 'generated' : 'top-down';
}
const DEFAULT_MAP_SIZE = { width: 20, height: 20 };
const MOVE_SPEED_TILES_PER_SEC = 4;
/** Upstash Redis 무료 한도 — 50ms마다 서버+Redis 쓰기는 과다(ISS-024). 픽셀 이동엔 250ms면 충분. */
const MOVE_EMIT_INTERVAL_MS = 250;
/** 채팅 말풍선 표시 시간 — 메이플스토리처럼 최신 메시지 하나만 보이다가 사라짐. */
const SPEECH_BUBBLE_DURATION_MS = 5000;
const SPEECH_BUBBLE_MAX_CHARS = 60;

const ARROW_KEY_CODES = [
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.DOWN,
  Phaser.Input.Keyboard.KeyCodes.LEFT,
  Phaser.Input.Keyboard.KeyCodes.RIGHT,
] as const;

type Direction = PlayerState['direction'];

type RawMapConfig = {
  storeId?: string;
  store_id?: string;
  mapSize?: { width?: number; height?: number };
  map_size?: { width?: number; height?: number };
  layers?: {
    floor?: Array<{ x?: number; y?: number; tile_id?: string; tileId?: string }>;
    objects?: Array<{
      x?: number;
      y?: number;
      asset_id?: string;
      assetId?: string;
      is_collidable?: boolean;
      isCollidable?: boolean;
    }>;
  };
};

export interface GameChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export interface TopDownGameMountOptions {
  container: HTMLElement;
  serverUrl: string;
  storeId: string;
  userId: string;
  username: string;
  onStatusChange?: (text: string) => void;
  onError?: (text: string) => void;
  onChannelChange?: (channel: ChannelInfo) => void;
  onChatMessage?: (message: GameChatMessage) => void;
  /** 내 캐릭터가 실제로 움직여 서버로 위치를 보낼 때마다 호출 — 잠수(자리비움) 타이머 리셋용. */
  onPlayerMove?: () => void;
  /**
   * 소켓이 생성된 "즉시"(서버 연결·입장 완료 전) 호출됨.
   * React StrictMode(개발 모드에서 effect가 두 번 실행됨)나 빠른 화면 이동 시,
   * 아직 입장(join)이 끝나기 전에 컴포넌트가 정리(cleanup)될 수 있는데,
   * 그 순간 바로 이 소켓을 끊어야 "유령 접속"이 채널 인원수를 올렸다가
   * 상대방 것까지 같이 0으로 만들어버리는 문제(ISS-019)를 막을 수 있다.
   */
  onSocketCreated?: (socket: Socket) => void;
  /** GUCCI 데모 등 — 등각 "인 척" 스킨 (그리드·소켓은 동일) */
  visualStyle?: WorldVisualStyle;
  /** Generated GUCCI — table 등 진열 구역 근처 여부 (React HUD 상호작용) */
  onNearInteractZone?: (zone: GeneratedInteractZone | null) => void;
  /** 모바일 레이아웃 — 캔버스 ENVELOP·줌 조정 (세로 화면 꽉 채움) */
  mobileLayout?: boolean;
  /**
   * Sprint 4 — DB `display_fixtures` 배치.
   * GUCCI generated 월드에서는 시각/충돌은 PNG 데모 유지, 상호작용은 기존 테이블 존 우선.
   * top-down / iso-fake 에서는 조형물 표시·점유 충돌·근접 상호작용에 사용.
   */
  displayFixtures?: FixturePlacement[];
  /** `buildOccupancyGrid` 결과 — 있으면 top-down walk에 occupied 반영 */
  occupancy?: OccupancyGridResult;
}

export interface VirtualDirections {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface TopDownGameController {
  sendChat: (message: string) => void;
  /** 채팅 입력창이 열려 있는 동안 false로 호출 — 캐릭터 이동/방향키 입력을 멈춘다. */
  setMovementEnabled: (enabled: boolean) => void;
  /** 모바일 가상 D-pad — 터치 버튼 상태를 방향키와 동일하게 반영한다. */
  setVirtualDirections: (dirs: Partial<VirtualDirections>) => void;
  getSelfTile: () => { x: number; y: number };
  /** 부모 컨테이너 크기 변경 시 Phaser 스케일 재계산 */
  resize: () => void;
  destroy: () => void;
}

interface PlayerVisual {
  userId: string;
  username: string;
  isSelf: boolean;
  isOwner: boolean;
  direction: Direction;
  x: number;
  y: number;
  body: Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  speechBubble: Phaser.GameObjects.Text;
  speechBubbleTimer?: Phaser.Time.TimerEvent;
}

export async function mountTopDownGame(
  options: TopDownGameMountOptions
): Promise<TopDownGameController> {
  const socket = createGameSocket(options.serverUrl);
  options.onSocketCreated?.(socket);
  options.onStatusChange?.('서버에 접속 중...');

  const isGucciGenerated =
    options.storeId === DEMO_STORE_ID &&
    resolveVisualStyle(options.storeId, options.visualStyle) === 'generated';
  const gucciSpawn = isGucciGenerated
    ? findGeneratedWalkableTile(
        GENERATED_WORLD.defaultSpawn.x,
        GENERATED_WORLD.defaultSpawn.y,
        DEFAULT_MAP_SIZE.width,
        DEFAULT_MAP_SIZE.height
      )
    : null;

  const joinResponse = await joinStore(socket, {
    storeId: options.storeId,
    userId: options.userId,
    username: options.username,
    ...(gucciSpawn
      ? { x: gucciSpawn.x, y: gucciSpawn.y, direction: GENERATED_WORLD.defaultSpawn.direction }
      : {}),
  });

  if (socket.disconnected) {
    // 응답이 오기 전에 이미 정리(cleanup)됨 — 뒤늦은 응답은 버리고 조용히 종료.
    throw new Error('cancelled');
  }

  if (!joinResponse.ok || !joinResponse.store) {
    const reason = joinResponse.error ?? '월드 입장에 실패했어요.';
    options.onError?.(reason);
    socket.disconnect();
    throw new Error(reason);
  }

  const normalizedMap = normalizeMapConfig(joinResponse, options.storeId);
  let currentChannel: ChannelInfo =
    joinResponse.channel ?? {
      number: 1,
      roomKey: `${options.storeId}:channel_1`,
      visitorCount: 1,
      maxCapacity: 40,
    };
  options.onChannelChange?.(currentChannel);
  options.onStatusChange?.('월드 로딩 중...');

  const visualStyle = resolveVisualStyle(options.storeId, options.visualStyle);
  const isGeneratedDemo = options.storeId === DEMO_STORE_ID && visualStyle === 'generated';
  const mobileLayout = Boolean(options.mobileLayout);
  const viewportWidth = isGeneratedDemo ? GUCCI_VIEWPORT_WIDTH_PX : VIEWPORT_WIDTH_PX;
  const viewportHeight = isGeneratedDemo ? GUCCI_VIEWPORT_HEIGHT_PX : VIEWPORT_HEIGHT_PX;
  const mobileSize = mobileLayout ? readMobileContainerSize(options.container) : null;
  const scene = new TopDownScene({
    mapConfig: normalizedMap,
    storeId: options.storeId,
    selfUserId: options.userId,
    selfUsername: options.username,
    selfIsOwner: joinResponse.self?.isOwner ?? false,
    initialPlayers: joinResponse.players ?? [],
    selfSpawn: joinResponse.self ?? { x: 10, y: 10, direction: 'down' },
    visualStyle,
    mobileLayout,
    onNearInteractZone: options.onNearInteractZone,
    displayFixtures: options.displayFixtures ?? [],
    occupancy: options.occupancy,
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.container,
    width: mobileSize?.w ?? viewportWidth,
    height: mobileSize?.h ?? viewportHeight,
    backgroundColor: '#0b1020',
    scene: scene,
    scale: {
      mode: mobileLayout ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  scene.onMove = (x, y, direction) => {
    socket.emit(SOCKET_EVENTS.PLAYER_MOVE, { x, y, direction });
    options.onPlayerMove?.();
  };
  scene.onReady = () => options.onStatusChange?.('입장 완료');

  socket.on(SOCKET_EVENTS.PLAYER_JOINED, (payload: PlayerState) => {
    scene.addOrUpdateRemotePlayer(
      payload.userId,
      payload.username,
      payload.x,
      payload.y,
      payload.direction,
      payload.isOwner ?? false
    );
  });

  socket.on(
    SOCKET_EVENTS.PLAYER_MOVED,
    (payload: Omit<PlayerState, 'username'> & { username?: string }) => {
      const known = scene.getPlayerUsername(payload.userId);
      scene.addOrUpdateRemotePlayer(
        payload.userId,
        payload.username ?? known ?? 'Guest',
        payload.x,
        payload.y,
        payload.direction,
        scene.getPlayerIsOwner(payload.userId) ?? false
      );
    }
  );

  socket.on(SOCKET_EVENTS.CHANNEL_VISITOR_COUNT, (payload: Partial<ChannelInfo>) => {
    currentChannel = {
      number: payload.number ?? currentChannel.number,
      roomKey: payload.roomKey ?? currentChannel.roomKey,
      visitorCount: payload.visitorCount ?? currentChannel.visitorCount,
      maxCapacity: payload.maxCapacity ?? currentChannel.maxCapacity,
    };
    options.onChannelChange?.(currentChannel);
  });

  socket.on(SOCKET_EVENTS.PLAYER_LEFT, (payload: { userId: string }) => {
    scene.removeRemotePlayer(payload.userId);
  });

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (payload: GameChatMessage) => {
    scene.showSpeechBubble(payload.userId, payload.message);
    options.onChatMessage?.(payload);
  });

  socket.on('disconnect', () => {
    options.onStatusChange?.('연결이 끊어졌어요.');
  });

  socket.on('connect_error', () => {
    options.onError?.('서버 연결에 실패했어요.');
  });

  return {
    sendChat(message: string) {
      const trimmed = message.trim();
      if (!trimmed) return;
      socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { message: trimmed });
    },
    setMovementEnabled(enabled: boolean) {
      scene.setMovementEnabled(enabled);
    },
    setVirtualDirections(dirs: Partial<VirtualDirections>) {
      scene.setVirtualDirections(dirs);
    },
    getSelfTile() {
      return scene.getSelfTile();
    },
    resize() {
      game.scale.refresh();
    },
    destroy() {
      socket.disconnect();
      game.destroy(true);
    },
  };
}

function readMobileContainerSize(container: HTMLElement): { w: number; h: number } {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w > 0 && h > 0) return { w, h };
  return {
    w: Math.max(window.innerWidth, 320),
    h: Math.max(window.innerHeight, 320),
  };
}

function normalizeMapConfig(response: StoreJoinResponse, storeId: string): MapConfig {
  const raw = (response.store?.mapConfig ?? {}) as RawMapConfig;
  const width = raw.mapSize?.width ?? raw.map_size?.width ?? DEFAULT_MAP_SIZE.width;
  const height = raw.mapSize?.height ?? raw.map_size?.height ?? DEFAULT_MAP_SIZE.height;

  return {
    storeId: raw.storeId ?? raw.store_id ?? storeId,
    mapSize: {
      width: safePositiveInt(width, DEFAULT_MAP_SIZE.width),
      height: safePositiveInt(height, DEFAULT_MAP_SIZE.height),
    },
    layers: {
      floor: (raw.layers?.floor ?? []).map((tile) => ({
        x: safeNumber(tile.x, 0),
        y: safeNumber(tile.y, 0),
        tileId: tile.tileId ?? tile.tile_id ?? 'floor_default',
      })),
      objects: (raw.layers?.objects ?? []).map((obj) => ({
        x: safeNumber(obj.x, 0),
        y: safeNumber(obj.y, 0),
        assetId: obj.assetId ?? obj.asset_id ?? 'object',
        isCollidable: obj.isCollidable ?? obj.is_collidable ?? false,
      })),
    },
  };
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safePositiveInt(value: unknown, fallback: number): number {
  const n = safeNumber(value, fallback);
  return n > 0 ? Math.floor(n) : fallback;
}

function tileToPixels(tileX: number, tileY: number) {
  return {
    x: tileX * DEFAULT_TILE_SIZE + DEFAULT_TILE_SIZE / 2,
    y: tileY * DEFAULT_TILE_SIZE + DEFAULT_TILE_SIZE / 2,
  };
}

class TopDownScene extends Phaser.Scene {
  private readonly mapConfig: MapConfig;
  private readonly storeId: string;
  private readonly isGeneratedDemo: boolean;
  private generatedTextureWidth = 1024;
  private generatedTextureHeight = 1536;
  private readonly selfUserId: string;
  private readonly selfUsername: string;
  private readonly selfIsOwner: boolean;
  private readonly initialPlayers: PlayerState[];
  private readonly selfSpawn: { x: number; y: number; direction: Direction };
  private readonly visualStyle: WorldVisualStyle;
  private readonly mobileLayout: boolean;
  private readonly displayFixtures: FixturePlacement[];
  private readonly occupancy?: OccupancyGridResult;
  private readonly isoOrigin: IsoPoint;
  private readonly npcChatTimers: Phaser.Time.TimerEvent[] = [];
  private readonly players = new Map<string, PlayerVisual>();
  private readonly blockedTiles = new Set<string>();
  private floorGraphics?: Phaser.GameObjects.Graphics;

  private cursors?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  /** 채팅 입력창이 열려 있는 동안은 false — 캐릭터 이동도, 방향키의 브라우저 기본 동작 가로채기도 멈춤. */
  private movementEnabled = true;
  private virtualDirections: VirtualDirections = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  private lastEmitMs = 0;
  private selfTile = { x: 10, y: 10, direction: 'down' as Direction };
  private readonly onNearInteractZone?: (zone: GeneratedInteractZone | null) => void;
  private lastInteractEmitMs = 0;
  private lastInteractZoneId: string | null = null;
  public onMove?: (x: number, y: number, direction: Direction) => void;
  public onReady?: () => void;

  constructor(config: {
    mapConfig: MapConfig;
    storeId: string;
    selfUserId: string;
    selfUsername: string;
    selfIsOwner: boolean;
    initialPlayers: PlayerState[];
    selfSpawn: { x: number; y: number; direction: Direction };
    visualStyle: WorldVisualStyle;
    mobileLayout?: boolean;
    onNearInteractZone?: (zone: GeneratedInteractZone | null) => void;
    displayFixtures?: FixturePlacement[];
    occupancy?: OccupancyGridResult;
  }) {
    super({ key: 'TopDownScene' });
    this.mapConfig = config.mapConfig;
    this.storeId = config.storeId;
    this.isGeneratedDemo = config.storeId === DEMO_STORE_ID && config.visualStyle === 'generated';
    this.selfUserId = config.selfUserId;
    this.selfUsername = config.selfUsername;
    this.selfIsOwner = config.selfIsOwner;
    this.initialPlayers = config.initialPlayers;
    this.selfSpawn = config.selfSpawn;
    this.visualStyle = config.visualStyle;
    this.mobileLayout = config.mobileLayout ?? false;
    this.onNearInteractZone = config.onNearInteractZone;
    this.displayFixtures = config.displayFixtures ?? [];
    this.occupancy = config.occupancy;
    const vpW = this.isGeneratedDemo ? GUCCI_VIEWPORT_WIDTH_PX : VIEWPORT_WIDTH_PX;
    this.isoOrigin = getIsoMapOrigin(
      config.mapConfig.mapSize.width,
      config.mapConfig.mapSize.height,
      vpW
    );
  }

  private tileToScreen(tileX: number, tileY: number): IsoPoint {
    if (this.visualStyle === 'generated') {
      return tileToGeneratedScreen(tileX, tileY);
    }
    if (this.visualStyle === 'iso-fake') {
      return tileToIsoScreen(tileX, tileY, this.isoOrigin.x, this.isoOrigin.y);
    }
    return tileToPixels(tileX, tileY);
  }

  preload() {
    if (this.visualStyle === 'generated') {
      this.load.image('gen-room', GENERATED_WORLD.room);
      GENERATED_WORLD.avatars.forEach((path, i) => {
        this.load.image(`gen-avatar-${i}`, path);
      });
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b1020');

    if (this.visualStyle === 'generated') {
      const tex = this.textures.get('gen-room');
      const source = tex.getSourceImage() as HTMLImageElement;
      this.generatedTextureWidth = source.width || 1024;
      this.generatedTextureHeight = source.height || 1536;
      this.add
        .image(this.generatedTextureWidth / 2, this.generatedTextureHeight / 2, 'gen-room')
        .setDepth(-50);
    } else if (this.visualStyle === 'iso-fake') {
      drawGucciBackdrop(this, VIEWPORT_WIDTH_PX, VIEWPORT_HEIGHT_PX);
      this.drawIsoFloor();
      this.drawIsoObjects();
      this.drawDisplayFixtures();
    } else {
      this.drawGrid();
      this.drawFloorTiles();
      this.drawObjects();
      this.drawDisplayFixtures();
    }

    this.createPlayers();
    if (this.isGeneratedDemo) {
      this.ensureSelfWalkable();
      this.spawnGeneratedNpcs();
    }
    this.setupCamera();

    if (this.mobileLayout) {
      this.scale.on('resize', () => this.applyMobileCameraZoom());
    }

    // 이동은 방향키만 사용.
    // 채팅 입력창에서 띄어쓰기(스페이스바)가 안 먹히는 문제가 생김 — 방향키만 따로 등록.
    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = {
        up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP, true),
        down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, true),
        left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, true),
        right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, true),
      };
    }
    // 씬이 준비되기 전에 setMovementEnabled()가 먼저 호출됐을 수도 있으니(예: 채팅을 이미
    // 열어놓은 상태로 게임 로딩이 끝난 경우) 지금 막 만들어진 키보드 입력에 그 상태를 다시 적용.
    this.applyMovementEnabled();

    this.onReady?.();
    this.emitInteractZoneIfNeeded(true);
  }

  update(_time: number, delta: number) {
    this.emitInteractZoneIfNeeded(false);

    const player = this.players.get(this.selfUserId);
    if (!player || !this.cursors || !this.movementEnabled) return;

    const deltaTile = (MOVE_SPEED_TILES_PER_SEC * delta) / 1000;
    let nextX = this.selfTile.x;
    let nextY = this.selfTile.y;
    let direction = this.selfTile.direction;

    const upPressed = this.cursors.up.isDown || this.virtualDirections.up;
    const downPressed = this.cursors.down.isDown || this.virtualDirections.down;
    const leftPressed = this.cursors.left.isDown || this.virtualDirections.left;
    const rightPressed = this.cursors.right.isDown || this.virtualDirections.right;

    if (this.visualStyle === 'generated') {
      const { dx, dy } = generatedMovementDelta(
        upPressed,
        downPressed,
        leftPressed,
        rightPressed
      );
      if (dx !== 0 || dy !== 0) {
        nextX += dx * deltaTile;
        nextY += dy * deltaTile;
        direction = directionFromGeneratedDelta(dx, dy);
      }
    } else {
      if (upPressed) {
        nextY -= deltaTile;
        direction = 'up';
      } else if (downPressed) {
        nextY += deltaTile;
        direction = 'down';
      }

      if (leftPressed) {
        nextX -= deltaTile;
        direction = 'left';
      } else if (rightPressed) {
        nextX += deltaTile;
        direction = 'right';
      }
    }

    if (this.isGeneratedDemo) {
      nextX = Phaser.Math.Clamp(nextX, 0.5, this.mapConfig.mapSize.width - 0.5);
      nextY = Phaser.Math.Clamp(nextY, 0.5, this.mapConfig.mapSize.height - 0.5);
    } else {
      nextX = Phaser.Math.Clamp(nextX, 1, this.mapConfig.mapSize.width - 2);
      nextY = Phaser.Math.Clamp(nextY, 1, this.mapConfig.mapSize.height - 2);
    }

    if (this.isBlocked(nextX, nextY)) {
      const slideX = this.isBlocked(nextX, this.selfTile.y);
      const slideY = this.isBlocked(this.selfTile.x, nextY);
      if (!slideX) {
        nextY = this.selfTile.y;
      } else if (!slideY) {
        nextX = this.selfTile.x;
      } else {
        return;
      }
    }

    this.selfTile = { x: nextX, y: nextY, direction };
    this.applyPlayerPosition(player, nextX, nextY, direction);

    if (this.visualStyle === 'generated' || this.visualStyle === 'iso-fake') {
      const depth =
        this.visualStyle === 'generated'
          ? generatedDepth(nextX, nextY, 5)
          : isoDepth(nextX, nextY, 5);
      player.body.setDepth(depth);
    }

    const now = this.time.now;
    if (now - this.lastEmitMs >= MOVE_EMIT_INTERVAL_MS) {
      this.lastEmitMs = now;
      this.onMove?.(nextX, nextY, direction);
    }
  }

  public getSelfTile(): { x: number; y: number } {
    return { x: this.selfTile.x, y: this.selfTile.y };
  }

  private emitInteractZoneIfNeeded(force: boolean) {
    if (!this.onNearInteractZone) return;
    const now = this.time?.now ?? 0;
    if (!force && now - this.lastInteractEmitMs < 150) return;
    this.lastInteractEmitMs = now;

    let zone: GeneratedInteractZone | null = null;
    if (this.isGeneratedDemo) {
      zone = getGeneratedInteractZone(this.selfTile.x, this.selfTile.y);
    } else {
      zone = this.findNearbyDisplayFixtureZone();
    }

    const id = zone?.id ?? null;
    if (force || id !== this.lastInteractZoneId) {
      this.lastInteractZoneId = id;
      this.onNearInteractZone(zone);
    }
  }

  /** top-down/iso — DB fixture 점유 링 근처면 상호작용 존 (Sprint 4) */
  private findNearbyDisplayFixtureZone(): GeneratedInteractZone | null {
    if (this.displayFixtures.length === 0) return null;
    const { width, height } = this.mapConfig.mapSize;
    const tx = Math.round(this.selfTile.x);
    const ty = Math.round(this.selfTile.y);
    for (const fixture of this.displayFixtures) {
      const ring = fixtureInteractRing(fixture, width, height);
      if (ring.some((t) => t.x === tx && t.y === ty)) {
        return {
          id: fixture.id,
          label: fixture.label?.trim() || fixture.templateId,
        };
      }
    }
    return null;
  }

  /** map_config objects 위에 display_fixtures 조형물 표시 (generated PNG 월드는 스킵) */
  private drawDisplayFixtures() {
    if (this.displayFixtures.length === 0) return;
    for (const fixture of this.displayFixtures) {
      const rot = fixture.rotation ?? 0;
      const { w, d } = effectiveFixtureSize(fixture.size, rot);
      const cx = fixture.origin.x + (w - 1) / 2;
      const cy = fixture.origin.y + (d - 1) / 2;
      const screen = this.tileToScreen(cx, cy);
      const label = fixture.label?.trim() || fixture.templateId;
      const depth =
        this.visualStyle === 'iso-fake' ? isoDepth(cx, cy, 4) : Math.floor((cx + cy) * 10 + 4);

      if (this.visualStyle === 'iso-fake') {
        drawIsoProp(this, cx, cy, fixture.templateId, screen.x, screen.y - 10);
      } else {
        this.add
          .rectangle(
            screen.x,
            screen.y,
            Math.max(28, w * (DEFAULT_TILE_SIZE - 8)),
            Math.max(28, d * (DEFAULT_TILE_SIZE - 8)),
            0xc9a962,
            0.85
          )
          .setDepth(depth);
      }
      this.add
        .text(screen.x, screen.y - 28, shortAssetLabel(label), {
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#00000099',
          padding: { left: 4, right: 4, top: 2, bottom: 2 },
        })
        .setOrigin(0.5)
        .setDepth(depth + 1);

      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < d; dy++) {
          this.blockedTiles.add(tileKey(fixture.origin.x + dx, fixture.origin.y + dy));
        }
      }
    }
  }

  public addOrUpdateRemotePlayer(
    userId: string,
    username: string,
    x: number,
    y: number,
    direction: Direction,
    isOwner: boolean
  ) {
    if (userId === this.selfUserId) return;
    const existing = this.players.get(userId);
    if (!existing) {
      const player = this.createPlayerVisual(userId, username, false, x, y, direction, isOwner);
      this.players.set(userId, player);
      return;
    }

    existing.username = username;
    existing.isOwner = isOwner;
    existing.label.setText(nameplateText(username, isOwner));
    this.applyPlayerPosition(existing, x, y, direction);
  }

  public removeRemotePlayer(userId: string) {
    if (userId.startsWith('npc:')) return;
    const player = this.players.get(userId);
    if (!player || player.isSelf) return;
    player.speechBubbleTimer?.remove(false);
    player.body.destroy();
    player.label.destroy();
    player.speechBubble.destroy();
    this.players.delete(userId);
  }

  public getPlayerUsername(userId: string): string | null {
    return this.players.get(userId)?.username ?? null;
  }

  public getPlayerIsOwner(userId: string): boolean | null {
    const player = this.players.get(userId);
    return player ? player.isOwner : null;
  }

  /**
   * 채팅 입력창이 열려 있는 동안 호출 — 캐릭터 이동을 멈추고, Phaser가 방향키를
   * 가로채지 않게(preventDefault) 꺼서 채팅 입력창 안에서 방향키로 커서 이동이 정상 동작하게 한다.
   * 씬(create())이 아직 준비되기 전에 불려도(예: 게임 로딩 중 채팅을 먼저 여는 경우) 안전하게
   * 상태만 저장해두고, create()에서 다시 적용한다 — `this.input`이 아직 없을 때 읽으면 죽기 때문.
   */
  public setMovementEnabled(enabled: boolean) {
    this.movementEnabled = enabled;
    if (!enabled) {
      this.virtualDirections = { up: false, down: false, left: false, right: false };
    }
    this.applyMovementEnabled();
  }

  public setVirtualDirections(dirs: Partial<VirtualDirections>) {
    this.virtualDirections = { ...this.virtualDirections, ...dirs };
  }

  private applyMovementEnabled() {
    const keyboard = this.input?.keyboard;
    if (!keyboard) return;

    if (this.movementEnabled) {
      keyboard.enabled = true;
      // 게임 중엔 방향키로 페이지 스크롤이 안 되게 다시 가로채기.
      keyboard.addCapture([...ARROW_KEY_CODES]);
    } else {
      keyboard.enabled = false;
      // 채팅 입력 중엔 방향키·스페이스바 등이 입력창에 정상 들어가게 가로채기 해제.
      keyboard.removeCapture([...ARROW_KEY_CODES]);
      // 키를 누른 채로 채팅을 열었을 때 "눌림" 상태가 그대로 남아 채팅을 닫자마자
      // 다시 움직이기 시작하는 것을 방지 (keyup을 못 받는 동안 상태가 멈춰있기 때문).
      this.cursors?.up.reset();
      this.cursors?.down.reset();
      this.cursors?.left.reset();
      this.cursors?.right.reset();
    }
  }

  /** 채팅 시 머리 위 말풍선 — 나타났다 5초 후 페이드아웃 */
  public showSpeechBubble(userId: string, message: string) {
    const player = this.players.get(userId);
    if (!player) return;

    player.speechBubbleTimer?.remove(false);
    this.tweens.killTweensOf(player.speechBubble);
    player.speechBubble.setAlpha(1);
    player.speechBubble.setText(truncateForBubble(message));
    player.speechBubble.setVisible(true);
    player.speechBubbleTimer = this.time.delayedCall(SPEECH_BUBBLE_DURATION_MS - 600, () => {
      this.tweens.add({
        targets: player.speechBubble,
        alpha: 0,
        duration: 600,
        onComplete: () => {
          player.speechBubble.setVisible(false);
          player.speechBubble.setAlpha(1);
        },
      });
    });
  }

  private ensureSelfWalkable() {
    const player = this.players.get(this.selfUserId);
    if (!player) return;
    const { width, height } = this.mapConfig.mapSize;
    if (!this.isBlocked(this.selfTile.x, this.selfTile.y)) return;
    const safe = findGeneratedWalkableTile(this.selfTile.x, this.selfTile.y, width, height);
    this.selfTile = { ...this.selfTile, x: safe.x, y: safe.y };
    this.applyPlayerPosition(player, safe.x, safe.y, this.selfTile.direction);
    this.onMove?.(safe.x, safe.y, this.selfTile.direction);
  }

  private spawnGeneratedNpcs() {
    const mapW = this.mapConfig.mapSize.width;
    const mapH = this.mapConfig.mapSize.height;
    GENERATED_NPCS.forEach((npc) => {
      if (this.players.has(npc.userId)) return;
      const pos = findGeneratedWalkableTile(npc.x, npc.y, mapW, mapH);
      const visual = this.createPlayerVisual(
        npc.userId,
        npc.username,
        false,
        pos.x,
        pos.y,
        npc.direction,
        false,
        npc.avatarIndex
      );
      this.players.set(npc.userId, visual);
      this.scheduleGeneratedNpcChatter(npc);
    });
  }

  private scheduleGeneratedNpcChatter(npc: GeneratedNpc) {
    const delayMs = 6000 + Math.floor(Math.random() * 8000);
    const timer = this.time.delayedCall(delayMs, () => {
      const line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
      this.showSpeechBubble(npc.userId, line);
      this.scheduleGeneratedNpcChatter(npc);
    });
    this.npcChatTimers.push(timer);
  }

  /** 카메라를 지도 전체 크기로 제한하고, 내 캐릭터를 부드럽게 따라다니게 한다. */
  private setupCamera() {
    if (this.visualStyle === 'generated') {
      this.cameras.main.setBounds(0, 0, this.generatedTextureWidth, this.generatedTextureHeight);
      if (this.mobileLayout) {
        this.applyMobileCameraZoom();
      } else {
        this.cameras.main.setZoom(0.72);
      }
    } else if (this.visualStyle === 'iso-fake') {
      const bounds = getIsoMapPixelBounds(
        this.mapConfig.mapSize.width,
        this.mapConfig.mapSize.height,
        this.isoOrigin.x,
        this.isoOrigin.y
      );
      this.cameras.main.setBounds(bounds.minX, bounds.minY, bounds.width, bounds.height);
    } else {
      const mapPixelWidth = this.mapConfig.mapSize.width * DEFAULT_TILE_SIZE;
      const mapPixelHeight = this.mapConfig.mapSize.height * DEFAULT_TILE_SIZE;
      this.cameras.main.setBounds(0, 0, mapPixelWidth, mapPixelHeight);
    }

    const self = this.players.get(this.selfUserId);
    if (self) {
      this.cameras.main.startFollow(self.body, true, 0.12, 0.12);
    }
  }

  /** 모바일 RESIZE — 화면 비율(세로/가로)에 맞춰 줌 조정, 여백 최소화 */
  private applyMobileCameraZoom() {
    if (this.visualStyle !== 'generated') return;
    const w = this.scale.width;
    const h = this.scale.height;
    if (w <= 0 || h <= 0) return;

    const isLandscape = w > h;
    const refW = GUCCI_VIEWPORT_WIDTH_PX;
    const refH = GUCCI_VIEWPORT_HEIGHT_PX;
    const scaleX = w / refW;
    const scaleY = h / refH;
    const coverScale = Math.max(scaleX, scaleY);

    let zoom = coverScale * (isLandscape ? 0.92 : 0.82);
    zoom = Phaser.Math.Clamp(zoom, 0.5, 1.35);
    this.cameras.main.setZoom(zoom);
  }

  private createPlayers() {
    const mapW = this.mapConfig.mapSize.width;
    const mapH = this.mapConfig.mapSize.height;
    const spawn = this.isGeneratedDemo
      ? findGeneratedWalkableTile(
          GENERATED_WORLD.defaultSpawn.x,
          GENERATED_WORLD.defaultSpawn.y,
          mapW,
          mapH
        )
      : {
          x: safeNumber(this.selfSpawn.x, 10),
          y: safeNumber(this.selfSpawn.y, 10),
        };
    this.selfTile = {
      x: safeNumber(spawn.x, 10),
      y: safeNumber(spawn.y, 10),
      direction: this.isGeneratedDemo
        ? GENERATED_WORLD.defaultSpawn.direction
        : this.selfSpawn.direction ?? 'down',
    };
    const self = this.createPlayerVisual(
      this.selfUserId,
      this.selfUsername,
      true,
      this.selfTile.x,
      this.selfTile.y,
      this.selfTile.direction,
      this.selfIsOwner
    );
    this.players.set(this.selfUserId, self);

    this.initialPlayers.forEach((p) => {
      if (p.userId === this.selfUserId) return;
      this.addOrUpdateRemotePlayer(p.userId, p.username, p.x, p.y, p.direction, p.isOwner ?? false);
    });
  }

  private createPlayerVisual(
    userId: string,
    username: string,
    isSelf: boolean,
    tileX: number,
    tileY: number,
    direction: Direction,
    isOwner: boolean,
    avatarVariant?: number
  ): PlayerVisual {
    const px = this.tileToScreen(tileX, tileY);
    const isGen = this.visualStyle === 'generated';
    const isIso = this.visualStyle === 'iso-fake';

    let body: Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
    if (isGen) {
      const idx = avatarVariant ?? (isSelf ? 0 : avatarIndexForUser(userId));
      body = this.add.image(px.x, px.y - GENERATED_WORLD.footLiftPx, `gen-avatar-${idx}`);
      body.setOrigin(0.5, 0.95);
      body.setScale(GENERATED_WORLD.avatarScale);
      body.setDepth(generatedDepth(tileX, tileY, 5));
    } else if (isIso) {
      body = createIsoPlayerVisual(this, tileX, tileY, isSelf, isOwner);
      body.setPosition(px.x, px.y - 4);
    } else {
      body = this.add.rectangle(px.x, px.y, 32, 38, isSelf ? 0xe94560 : 0x3e7bfa);
    }

    const labelY = isGen ? generatedLabelY(tileX, tileY) : isIso ? px.y + 18 : px.y + 30;
    const label = this.add
      .text(px.x, labelY, nameplateText(username, isOwner), {
        fontSize: isGen ? '11px' : isIso ? '11px' : '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.75)',
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
      })
      .setOrigin(0.5, 0);
    if (isGen) {
      label.setDepth(generatedDepth(tileX, tileY, 6));
    } else if (isIso) {
      label.setDepth(isoDepth(tileX, tileY, 6));
    }

    const bubbleY = isGen
      ? generatedSpeechBubbleY(tileX, tileY)
      : isIso
        ? px.y - 46
        : px.y - 38;
    const speechBubble = this.add
      .text(px.x, bubbleY, '', {
        fontSize: '12px',
        color: '#1a1a2e',
        backgroundColor: '#ffffff',
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
        wordWrap: { width: 180, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setVisible(false)
      .setAlpha(1);
    if (isGen) {
      speechBubble.setDepth(generatedDepth(tileX, tileY, 25));
    } else if (isIso) {
      speechBubble.setDepth(isoDepth(tileX, tileY, 25));
    }

    return {
      userId,
      username,
      isSelf,
      isOwner,
      direction,
      x: tileX,
      y: tileY,
      body,
      label,
      speechBubble,
    };
  }

  private applyPlayerPosition(player: PlayerVisual, tileX: number, tileY: number, direction: Direction) {
    const px = this.tileToScreen(tileX, tileY);
    const isGen = this.visualStyle === 'generated';
    const isIso = this.visualStyle === 'iso-fake';
    const bodyY = isGen ? px.y - GENERATED_WORLD.footLiftPx : isIso ? px.y - 4 : px.y;
    player.body.setPosition(px.x, bodyY);
    const labelY = isGen ? generatedLabelY(tileX, tileY) : isIso ? px.y + 18 : px.y + 30;
    player.label.setPosition(px.x, labelY);
    const bubbleY = isGen
      ? generatedSpeechBubbleY(tileX, tileY)
      : isIso
        ? px.y - 46
        : px.y - 38;
    player.speechBubble.setPosition(px.x, bubbleY);
    if (isGen) {
      player.body.setDepth(generatedDepth(tileX, tileY, 5));
      player.label.setDepth(generatedDepth(tileX, tileY, 6));
      player.speechBubble.setDepth(generatedDepth(tileX, tileY, 25));
    } else if (isIso) {
      player.body.setDepth(isoDepth(tileX, tileY, 5));
      player.label.setDepth(isoDepth(tileX, tileY, 6));
      player.speechBubble.setDepth(isoDepth(tileX, tileY, 25));
    }
    player.x = tileX;
    player.y = tileY;
    player.direction = direction;
  }

  private drawGrid() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x1f2942, 1);
    for (let x = 0; x <= this.mapConfig.mapSize.width; x += 1) {
      g.moveTo(x * DEFAULT_TILE_SIZE, 0);
      g.lineTo(x * DEFAULT_TILE_SIZE, this.mapConfig.mapSize.height * DEFAULT_TILE_SIZE);
    }
    for (let y = 0; y <= this.mapConfig.mapSize.height; y += 1) {
      g.moveTo(0, y * DEFAULT_TILE_SIZE);
      g.lineTo(this.mapConfig.mapSize.width * DEFAULT_TILE_SIZE, y * DEFAULT_TILE_SIZE);
    }
    g.strokePath();
  }

  private drawFloorTiles() {
    const floorLayer = this.mapConfig.layers.floor;
    const g = this.add.graphics();
    floorLayer.forEach((tile) => {
      g.fillStyle(getFloorColor(tile.tileId), 0.9);
      g.fillRect(
        tile.x * DEFAULT_TILE_SIZE + 2,
        tile.y * DEFAULT_TILE_SIZE + 2,
        DEFAULT_TILE_SIZE - 4,
        DEFAULT_TILE_SIZE - 4
      );
    });
  }

  private drawObjects() {
    this.mapConfig.layers.objects.forEach((obj) => {
      const px = tileToPixels(obj.x, obj.y);
      const fill = obj.isCollidable ? 0x8e44ad : 0x20855c;
      this.add.rectangle(px.x, px.y, 36, 38, fill);
      this.add
        .text(px.x, px.y - 30, shortAssetLabel(obj.assetId), {
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#00000066',
          padding: { left: 5, right: 5, top: 2, bottom: 2 },
        })
        .setOrigin(0.5);
      if (obj.isCollidable) {
        this.blockedTiles.add(tileKey(obj.x, obj.y));
      }
    });
  }

  /** GUCCI fake-isometric floor — full grid with stripe carpet + map_config overrides. */
  private drawIsoFloor() {
    const floorLookup = new Map<string, string>();
    this.mapConfig.layers.floor.forEach((tile) => {
      floorLookup.set(tileKey(tile.x, tile.y), tile.tileId);
    });

    this.floorGraphics = this.add.graphics().setDepth(0);
    const { width, height } = this.mapConfig.mapSize;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const key = tileKey(x, y);
        const tileId =
          floorLookup.get(key) ??
          ((x + y) % 4 === 0 || (x + y) % 4 === 3 ? 'carpet_gucci_stripe' : 'carpet_gucci');
        const colors = floorColorsForTile(tileId);
        const screen = this.tileToScreen(x, y);
        drawIsoFloorTile(this.floorGraphics, screen.x, screen.y, colors);
      }
    }

    const entrance = this.tileToScreen(Math.floor(width / 2), height - 2);
    this.add
      .text(entrance.x, entrance.y - 20, '▲ ENTRANCE', {
        fontSize: '11px',
        color: '#c9a962',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(isoDepth(Math.floor(width / 2), height - 2, 1));
  }

  private drawIsoObjects() {
    const sorted = [...this.mapConfig.layers.objects].sort(
      (a, b) => a.x + a.y - (b.x + b.y)
    );
    sorted.forEach((obj) => {
      const screen = this.tileToScreen(obj.x, obj.y);
      drawIsoProp(this, obj.x, obj.y, obj.assetId, screen.x, screen.y - 10);
      if (obj.isCollidable) {
        this.blockedTiles.add(tileKey(obj.x, obj.y));
      }
    });
  }

  private isBlocked(tileX: number, tileY: number): boolean {
    if (this.isGeneratedDemo) {
      return isGeneratedBlockedTile(
        tileX,
        tileY,
        this.mapConfig.mapSize.width,
        this.mapConfig.mapSize.height
      );
    }
    const tx = Math.round(tileX);
    const ty = Math.round(tileY);
    if (this.occupancy) {
      return !canWalk(this.occupancy.grid, tx, ty);
    }
    const key = tileKey(tx, ty);
    if (this.blockedTiles.has(key)) return true;
    return false;
  }
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

/** 왕관 + 닉네임 순서로 이름표 문구를 만든다 (점주만 왕관 표시). */
function nameplateText(username: string, isOwner: boolean): string {
  return isOwner ? `👑 ${username}` : username;
}

function truncateForBubble(message: string): string {
  return message.length > SPEECH_BUBBLE_MAX_CHARS
    ? `${message.slice(0, SPEECH_BUBBLE_MAX_CHARS)}...`
    : message;
}

function shortAssetLabel(assetId: string): string {
  if (!assetId) return 'asset';
  const compact = assetId.replace(/_/g, ' ');
  return compact.length > 16 ? `${compact.slice(0, 16)}...` : compact;
}

function getFloorColor(tileId: string): number {
  if (tileId.includes('carpet')) return 0x6b1f34;
  if (tileId.includes('wood')) return 0x7b5732;
  if (tileId.includes('stone')) return 0x4f596a;
  return 0x263554;
}
