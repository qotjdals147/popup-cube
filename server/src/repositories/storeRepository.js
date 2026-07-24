const { getSupabaseAdmin } = require('../config/supabase');

async function findStoreById(storeId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, map_config, max_channel_capacity, is_active, popup_ends_at, owner_id')
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getActiveChannels(storeId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('channels')
    .select('id, store_id, channel_number, redis_room_key')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('channel_number', { ascending: true });

  if (error) throw error;
  return data;
}

async function createChannel(storeId, channelNumber) {
  const supabase = getSupabaseAdmin();
  const redisRoomKey = `${storeId}:channel_${channelNumber}`;

  const { data, error } = await supabase
    .from('channels')
    .upsert(
      { store_id: storeId, channel_number: channelNumber, redis_room_key: redisRoomKey, is_active: true },
      { onConflict: 'store_id,channel_number' }
    )
    .select('id, store_id, channel_number, redis_room_key')
    .single();

  if (error) throw error;
  return data;
}

async function getNextChannelNumber(storeId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('channels')
    .select('channel_number')
    .eq('store_id', storeId)
    .order('channel_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.channel_number ?? 0) + 1;
}

module.exports = {
  findStoreById,
  getActiveChannels,
  createChannel,
  getNextChannelNumber,
};
