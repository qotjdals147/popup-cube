const config = require('../config');
const channelService = require('../services/channelService');
const storeRepository = require('../repositories/storeRepository');

/** In-memory map: socket.id -> session context */
const sessions = new Map();
/** `${roomKey}:${userId}` -> last Redis persist timestamp (Upstash quota — ISS-024) */
const redisPersistThrottle = new Map();

/**
 * Attach Socket.io event handlers for store channeling & position sync.
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    /**
     * Client joins a pop-up store.
     * Payload: { storeId, userId, username, x?, y?, direction? }
     */
    socket.on('store:join', async (payload, ack) => {
      try {
        const { storeId, userId, username } = payload ?? {};

        if (!storeId || !userId) {
          return ack?.({ ok: false, error: 'storeId and userId are required' });
        }

        const store = await storeRepository.findStoreById(storeId);
        if (!store) {
          return ack?.({ ok: false, error: 'Store not found' });
        }
        if (!store.is_active) {
          return ack?.({ ok: false, error: 'Store is not active' });
        }

        const maxCapacity = store.max_channel_capacity;
        const assignment = await channelService.assignChannel(storeId, userId, maxCapacity);
        // 이 매장의 점주 본인인지 (이름표 왕관 표시 + 잠수 강퇴 면제 판단용 — ISS-020 관련 신규 기능)
        const isOwner = !!store.owner_id && store.owner_id === userId;

        const spawnX = payload.x ?? 10;
        const spawnY = payload.y ?? 10;
        const direction = payload.direction ?? 'down';

        await channelService.updatePlayerState(assignment.roomKey, userId, {
          x: spawnX,
          y: spawnY,
          direction,
          username: username ?? 'Guest',
          isOwner,
        });
        await channelService.setPlayerStateExpiry(assignment.roomKey, userId);
        redisPersistThrottle.set(`${assignment.roomKey}:${userId}`, Date.now());

        // Leave previous room if reconnecting
        const prev = sessions.get(socket.id);
        if (prev) {
          await handleLeave(socket, io, prev);
        }

        sessions.set(socket.id, {
          storeId,
          userId,
          username: username ?? 'Guest',
          isOwner,
          roomKey: assignment.roomKey,
          channelNumber: assignment.channelNumber,
          maxCapacity,
        });

        await socket.join(assignment.roomKey);

        const existingPlayers = await channelService.getPlayersInChannel(assignment.roomKey);
        const others = existingPlayers.filter((p) => p.userId !== userId);

        // Notify others in the same channel
        socket.to(assignment.roomKey).emit('player:joined', {
          userId,
          username: username ?? 'Guest',
          x: spawnX,
          y: spawnY,
          direction,
          isOwner,
        });
        io.to(assignment.roomKey).emit('channel:visitor-count', {
          number: assignment.channelNumber,
          roomKey: assignment.roomKey,
          visitorCount: assignment.visitorCount,
          maxCapacity,
        });

        console.log(
          `[channel] ${userId} -> ${assignment.roomKey} (${assignment.visitorCount}/${maxCapacity})`
        );

        ack?.({
          ok: true,
          store: {
            id: store.id,
            name: store.name,
            mapConfig: store.map_config,
            popupEndsAt: store.popup_ends_at,
          },
          channel: {
            number: assignment.channelNumber,
            roomKey: assignment.roomKey,
            visitorCount: assignment.visitorCount,
            maxCapacity,
          },
          players: others,
          self: { x: spawnX, y: spawnY, direction, isOwner },
        });
      } catch (err) {
        console.error('[store:join] error:', err);
        ack?.({ ok: false, error: 'Failed to join store' });
      }
    });

    /**
     * Real-time position update.
     * Payload: { x, y, direction }
     */
    socket.on('player:move', async (payload) => {
      const session = sessions.get(socket.id);
      if (!session) return;

      const { x, y, direction } = payload ?? {};
      if (typeof x !== 'number' || typeof y !== 'number') return;

      const persistKey = `${session.roomKey}:${session.userId}`;
      const now = Date.now();
      const lastPersist = redisPersistThrottle.get(persistKey) ?? 0;
      if (now - lastPersist >= config.redisMovePersistIntervalMs) {
        await channelService.updatePlayerState(session.roomKey, session.userId, {
          x,
          y,
          direction: direction ?? 'down',
          username: session.username,
          isOwner: session.isOwner,
        });
        redisPersistThrottle.set(persistKey, now);
      }

      socket.to(session.roomKey).emit('player:moved', {
        userId: session.userId,
        username: session.username,
        x,
        y,
        direction: direction ?? 'down',
      });
    });

    /**
     * Chat message within channel.
     * Payload: { message }
     */
    socket.on('chat:message', (payload) => {
      const session = sessions.get(socket.id);
      if (!session) return;

      const { message } = payload ?? {};
      if (!message || typeof message !== 'string') return;

      io.to(session.roomKey).emit('chat:message', {
        userId: session.userId,
        username: session.username,
        message: message.slice(0, 500),
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', async () => {
      const session = sessions.get(socket.id);
      if (session) {
        await handleLeave(socket, io, session);
        sessions.delete(socket.id);
      }
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}

async function handleLeave(socket, io, session) {
  redisPersistThrottle.delete(`${session.roomKey}:${session.userId}`);
  const remaining = await channelService.leaveChannel(session.roomKey, session.userId);

  socket.to(session.roomKey).emit('player:left', {
    userId: session.userId,
  });
  io.to(session.roomKey).emit('channel:visitor-count', {
    number: session.channelNumber,
    roomKey: session.roomKey,
    visitorCount: remaining,
    maxCapacity: session.maxCapacity ?? 40,
  });

  console.log(
    `[channel] ${session.userId} left ${session.roomKey} (${remaining} remaining)`
  );
}

module.exports = { registerSocketHandlers };
