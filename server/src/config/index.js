require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  maxChannelCapacity: parseInt(process.env.MAX_CHANNEL_CAPACITY, 10) || 40,
  /** Upstash 무료 한도 보호: 이동마다 Redis에 쓰지 않고 이 간격(ms)마다만 좌표 영속화 */
  redisMovePersistIntervalMs: parseInt(process.env.REDIS_MOVE_PERSIST_MS, 10) || 500,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  webOrigin: process.env.WEB_ORIGIN || '*',
};
