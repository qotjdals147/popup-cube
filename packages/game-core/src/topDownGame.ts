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

// 타일/캐릭터/글자가 전체적으로 작아 보인다는 피드백 반영 — 타일 크기를 키우고,
// 지도 전체를 억지로 화면에 눌러 담는 대신 "고정된 카메라 창"만 보여준 뒤 캐릭터를 따라다니게 함.
const DEFAULT_TILE_SIZE = 56; // 기존 40 → 56 (약 1.4배)
const VIEWPORT_WIDTH_PX = 800;
const VIEWPORT_HEIGHT_PX = 520;
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
}

export interface TopDownGameController {
  sendChat: (message: string) => void;
  /** 채팅 입력창이 열려 있는 동안 false로 호출 — 캐릭터 이동/방향키 입력을 멈춘다. */
  setMovementEnabled: (enabled: boolean) => void;
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
  body: Phaser.GameObjects.Rectangle;
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

  const joinResponse = await joinStore(socket, {
    storeId: options.storeId,
    userId: options.userId,
    username: options.username,
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

  const scene = new TopDownScene({
    mapConfig: normalizedMap,
    selfUserId: options.userId,
    selfUsername: options.username,
    selfIsOwner: joinResponse.self?.isOwner ?? false,
    initialPlayers: joinResponse.players ?? [],
    selfSpawn: joinResponse.self ?? { x: 10, y: 10, direction: 'down' },
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.container,
    // 지도 전체 크기가 아니라 "고정된 카메라 창" 크기를 캔버스 크기로 사용 — 지도가 커도
    // 화면에는 이 창만큼만 보이고, 카메라가 캐릭터를 따라다니며 나머지를 보여준다.
    width: VIEWPORT_WIDTH_PX,
    height: VIEWPORT_HEIGHT_PX,
    backgroundColor: '#111629',
    scene: scene,
    scale: {
      // RESIZE 모드는 부모 높이 계산과 맞물리면 레이아웃이 계속 커질 수 있어
      // 데모에서는 FIT으로 고정 뷰포트를 안전하게 스케일한다. (ISS-016)
      mode: Phaser.Scale.FIT,
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
    destroy() {
      socket.disconnect();
      game.destroy(true);
    },
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
  private readonly selfUserId: string;
  private readonly selfUsername: string;
  private readonly selfIsOwner: boolean;
  private readonly initialPlayers: PlayerState[];
  private readonly selfSpawn: { x: number; y: number; direction: Direction };
  private readonly players = new Map<string, PlayerVisual>();
  private readonly blockedTiles = new Set<string>();

  private cursors?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  /** 채팅 입력창이 열려 있는 동안은 false — 캐릭터 이동도, 방향키의 브라우저 기본 동작 가로채기도 멈춤. */
  private movementEnabled = true;
  private lastEmitMs = 0;
  private selfTile = { x: 10, y: 10, direction: 'down' as Direction };
  public onMove?: (x: number, y: number, direction: Direction) => void;
  public onReady?: () => void;

  constructor(config: {
    mapConfig: MapConfig;
    selfUserId: string;
    selfUsername: string;
    selfIsOwner: boolean;
    initialPlayers: PlayerState[];
    selfSpawn: { x: number; y: number; direction: Direction };
  }) {
    super({ key: 'TopDownScene' });
    this.mapConfig = config.mapConfig;
    this.selfUserId = config.selfUserId;
    this.selfUsername = config.selfUsername;
    this.selfIsOwner = config.selfIsOwner;
    this.initialPlayers = config.initialPlayers;
    this.selfSpawn = config.selfSpawn;
  }

  create() {
    this.cameras.main.setBackgroundColor('#111629');
    this.drawGrid();
    this.drawFloorTiles();
    this.drawObjects();
    this.createPlayers();
    this.setupCamera();

    // 이동은 방향키만 사용. createCursorKeys()는 SPACE까지 전역 가로채기(capture)해서
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
  }

  update(_time: number, delta: number) {
    const player = this.players.get(this.selfUserId);
    if (!player || !this.cursors || !this.movementEnabled) return;

    const deltaTile = (MOVE_SPEED_TILES_PER_SEC * delta) / 1000;
    let nextX = this.selfTile.x;
    let nextY = this.selfTile.y;
    let direction = this.selfTile.direction;

    const upPressed = this.cursors.up.isDown;
    const downPressed = this.cursors.down.isDown;
    const leftPressed = this.cursors.left.isDown;
    const rightPressed = this.cursors.right.isDown;

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

    nextX = Phaser.Math.Clamp(nextX, 0, this.mapConfig.mapSize.width - 1);
    nextY = Phaser.Math.Clamp(nextY, 0, this.mapConfig.mapSize.height - 1);

    if (this.isBlocked(nextX, nextY)) return;

    this.selfTile = { x: nextX, y: nextY, direction };
    this.applyPlayerPosition(player, nextX, nextY, direction);

    const now = this.time.now;
    if (now - this.lastEmitMs >= MOVE_EMIT_INTERVAL_MS) {
      this.lastEmitMs = now;
      this.onMove?.(nextX, nextY, direction);
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
    this.applyMovementEnabled();
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

  /** 채팅 시 머리 위 말풍선 표시 — 5초 후 자동 숨김, 그 전에 새 메시지가 오면 교체 후 다시 5초(최신 메시지만 표시). */
  public showSpeechBubble(userId: string, message: string) {
    const player = this.players.get(userId);
    if (!player) return;

    player.speechBubbleTimer?.remove(false);
    player.speechBubble.setText(truncateForBubble(message));
    player.speechBubble.setVisible(true);
    player.speechBubbleTimer = this.time.delayedCall(SPEECH_BUBBLE_DURATION_MS, () => {
      player.speechBubble.setVisible(false);
    });
  }

  /** 카메라를 지도 전체 크기로 제한하고, 내 캐릭터를 부드럽게 따라다니게 한다. */
  private setupCamera() {
    const mapPixelWidth = this.mapConfig.mapSize.width * DEFAULT_TILE_SIZE;
    const mapPixelHeight = this.mapConfig.mapSize.height * DEFAULT_TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapPixelWidth, mapPixelHeight);

    const self = this.players.get(this.selfUserId);
    if (self) {
      this.cameras.main.startFollow(self.body, true, 0.15, 0.15);
    }
  }

  private createPlayers() {
    this.selfTile = {
      x: safeNumber(this.selfSpawn.x, 10),
      y: safeNumber(this.selfSpawn.y, 10),
      direction: this.selfSpawn.direction ?? 'down',
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
    isOwner: boolean
  ): PlayerVisual {
    const px = tileToPixels(tileX, tileY);
    const body = this.add.rectangle(px.x, px.y, 32, 38, isSelf ? 0xe94560 : 0x3e7bfa);
    // 닉네임은 발밑에 (왕관 있으면 왼쪽에 붙음) — 머리 위 자리는 채팅 말풍선용으로 비워둠.
    const label = this.add
      .text(px.x, px.y + 30, nameplateText(username, isOwner), {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { left: 8, right: 8, top: 3, bottom: 3 },
      })
      .setOrigin(0.5);
    const speechBubble = this.add
      .text(px.x, px.y - 38, '', {
        fontSize: '14px',
        color: '#1a1a2e',
        backgroundColor: '#ffffff',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        wordWrap: { width: 220, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setVisible(false)
      .setDepth(10);

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
    const px = tileToPixels(tileX, tileY);
    player.body.setPosition(px.x, px.y);
    player.label.setPosition(px.x, px.y + 30);
    player.speechBubble.setPosition(px.x, px.y - 38);
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

  private isBlocked(tileX: number, tileY: number): boolean {
    return this.blockedTiles.has(tileKey(Math.round(tileX), Math.round(tileY)));
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
