const express = require('express');
const storeRepository = require('../repositories/storeRepository');
const channelService = require('../services/channelService');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/stores/:storeId
 * Store metadata + active channel summary
 */
router.get('/stores/:storeId', async (req, res) => {
  try {
    const store = await storeRepository.findStoreById(req.params.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const channels = await storeRepository.getActiveChannels(store.id);
    const channelStats = await Promise.all(
      channels.map(async (ch) => ({
        channelNumber: ch.channel_number,
        roomKey: ch.redis_room_key,
        visitorCount: await channelService.getChannelVisitorCount(ch.redis_room_key),
      }))
    );

    const totalVisitors = channelStats.reduce((sum, c) => sum + c.visitorCount, 0);

    res.json({
      id: store.id,
      name: store.name,
      mapConfig: store.map_config,
      maxChannelCapacity: store.max_channel_capacity,
      isActive: store.is_active,
      popupEndsAt: store.popup_ends_at,
      totalVisitors,
      channels: channelStats,
    });
  } catch (err) {
    console.error('[GET /stores/:storeId]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
