/** Demo store used for investor pitch (AD-009) — GUCCI, internal demo only */
export const DEMO_STORE_ID = 'popup_gucci_01';

export const DEFAULT_MAX_CHANNEL_CAPACITY = 40;

export const SOCKET_EVENTS = {
  STORE_JOIN: 'store:join',
  PLAYER_MOVE: 'player:move',
  PLAYER_JOINED: 'player:joined',
  PLAYER_MOVED: 'player:moved',
  PLAYER_LEFT: 'player:left',
  CHANNEL_VISITOR_COUNT: 'channel:visitor-count',
  CHAT_MESSAGE: 'chat:message',
} as const;
