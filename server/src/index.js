require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const { createApp } = require('./app');
const { getRedis, closeRedis } = require('./config/redis');
const { registerSocketHandlers } = require('./socket');

async function start() {
  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: config.webOrigin === '*' ? true : config.webOrigin,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Verify Redis connectivity before accepting connections
  const redis = getRedis();
  await redis.connect();
  console.log('[redis] connected');

  registerSocketHandlers(io);

  server.listen(config.port, () => {
    console.log(`[server] POP-UP CUBE channel server running on port ${config.port}`);
    console.log(`[server] max channel capacity: ${config.maxChannelCapacity}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close();
    io.close();
    await closeRedis();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
