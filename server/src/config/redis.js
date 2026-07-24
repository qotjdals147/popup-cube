const Redis = require('ioredis');
const config = require('./index');

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

module.exports = { getRedis, closeRedis };
