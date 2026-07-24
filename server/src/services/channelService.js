const config = require('../config');
const { getRedis } = require('../config/redis');
const storeRepository = require('../repositories/storeRepository');

/** Redis key helpers */
const keys = {
  /** Sorted set of active channel room keys for a store */
  channelIndex: (storeId) => `store:${storeId}:channels`,
  /**
   * Set(집합) of unique userIds currently in a channel (SCARD = current count).
   * 예전엔 List(LPUSH/LREM)였는데, 같은 유저가 실수로 두 번 접속(예: 소켓 재연결,
   * React StrictMode 개발모드 중복 실행)하면 LREM key 0 userId가 "같은 값 전부"를
   * 지워버려서 다른 정상 접속까지 같이 0명으로 사라지는 버그(ISS-019)가 있었음.
   * Set은 같은 userId가 중복 저장되지 않고(SADD 멱등), 삭제도 그 유저 하나만
   * 정확히 지워지므로(SREM) 이 문제가 원천적으로 발생하지 않음.
   */
  channelUsers: (roomKey) => `store:${roomKey}:users`,
  /** Hash of player state: x, y, direction, username */
  playerState: (roomKey, userId) => `store:${roomKey}:player:${userId}`,
};

/**
 * Assign a user to an available channel (max capacity from store config).
 * Creates a new channel in DB + Redis when all existing channels are full.
 */
async function assignChannel(storeId, userId, maxCapacity) {
  const redis = getRedis();
  const channelIndexKey = keys.channelIndex(storeId);

  const dbChannels = await storeRepository.getActiveChannels(storeId);

  // Try existing channels first (lowest channel_number first)
  for (const channel of dbChannels) {
    const usersKey = keys.channelUsers(channel.redis_room_key);
    const alreadyIn = await redis.sismember(usersKey, userId);
    const count = await redis.scard(usersKey);

    if (alreadyIn || count < maxCapacity) {
      await redis.sadd(usersKey, userId);
      await redis.sadd(channelIndexKey, channel.redis_room_key);
      return {
        channelId: channel.id,
        channelNumber: channel.channel_number,
        roomKey: channel.redis_room_key,
        visitorCount: alreadyIn ? count : count + 1,
      };
    }
  }

  // All channels full — create a new one
  const nextNumber = await storeRepository.getNextChannelNumber(storeId);
  const newChannel = await storeRepository.createChannel(storeId, nextNumber);
  const usersKey = keys.channelUsers(newChannel.redis_room_key);

  await redis.sadd(usersKey, userId);
  await redis.sadd(channelIndexKey, newChannel.redis_room_key);

  return {
    channelId: newChannel.id,
    channelNumber: newChannel.channel_number,
    roomKey: newChannel.redis_room_key,
    visitorCount: 1,
  };
}

/**
 * Remove user from channel and clean up player state.
 */
async function leaveChannel(roomKey, userId) {
  const redis = getRedis();
  const usersKey = keys.channelUsers(roomKey);
  const stateKey = keys.playerState(roomKey, userId);

  await redis.srem(usersKey, userId);
  await redis.del(stateKey);

  const remaining = await redis.scard(usersKey);
  return remaining;
}

/**
 * Get all player states currently in a channel.
 */
async function getPlayersInChannel(roomKey) {
  const redis = getRedis();
  const usersKey = keys.channelUsers(roomKey);
  const userIds = await redis.smembers(usersKey);

  const players = [];
  for (const userId of userIds) {
    const stateKey = keys.playerState(roomKey, userId);
    const data = await redis.hgetall(stateKey);
    if (Object.keys(data).length > 0) {
      players.push({
        userId,
        x: parseFloat(data.x) || 0,
        y: parseFloat(data.y) || 0,
        direction: data.direction || 'down',
        username: data.username || 'Guest',
        isOwner: data.isOwner === '1',
      });
    }
  }
  return players;
}

/**
 * Persist player position in Redis (hset only — expire는 입장 시 1회, ISS-024).
 */
async function updatePlayerState(roomKey, userId, state) {
  const redis = getRedis();
  const stateKey = keys.playerState(roomKey, userId);

  await redis.hset(stateKey, {
    x: String(state.x),
    y: String(state.y),
    direction: state.direction || 'down',
    username: state.username || 'Guest',
    isOwner: state.isOwner ? '1' : '0',
  });
}

/** 입장 시에만 호출 — 이동마다 expire 하면 Upstash Writes가 2배로 폭증함 */
async function setPlayerStateExpiry(roomKey, userId, ttlSeconds = 86400) {
  const redis = getRedis();
  await redis.expire(keys.playerState(roomKey, userId), ttlSeconds);
}

/**
 * Get visitor count for a channel.
 */
async function getChannelVisitorCount(roomKey) {
  const redis = getRedis();
  return redis.scard(keys.channelUsers(roomKey));
}

module.exports = {
  keys,
  assignChannel,
  leaveChannel,
  getPlayersInChannel,
  updatePlayerState,
  setPlayerStateExpiry,
  getChannelVisitorCount,
  maxCapacity: config.maxChannelCapacity,
};
