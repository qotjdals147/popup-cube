const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRouter = require('./routes/api');

function createApp() {
  const app = express();

  app.use(cors({ origin: config.webOrigin === '*' ? true : config.webOrigin }));
  app.use(express.json());
  app.use('/api', apiRouter);

  return app;
}

module.exports = { createApp };
