import type { Area } from 'react-easy-crop';
import { supabase } from './supabase';

export interface StoreNewsPost {
  id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  image_crop: Area | null;
  link_product_id: string | null;
  sort_order: number;
  created_at: string;
  is_active?: boolean;
}

export const MAX_STORE_NEWS_MEDIA_BYTES = 5 * 1024 * 1024;

const ALLOWED_STORE_NEWS_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function getStoreNewsForShop(storeId: string, limit = 12): Promise<StoreNewsPost[]> {
  const { data, error } = await supabase.rpc('get_store_news_for_shop', {
    p_store_id: storeId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as StoreNewsPost[];
}

export async function listOwnerStoreNewsPosts(storeId: string): Promise<StoreNewsPost[]> {
  const { data, error } = await supabase
    .from('store_news_posts')
    .select('id, title, body, image_url, image_crop, link_product_id, sort_order, created_at, is_active')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StoreNewsPost[];
}

export async function uploadStoreNewsMedia(userId: string, storeId: string, file: File): Promise<string> {
  if (file.size > MAX_STORE_NEWS_MEDIA_BYTES) {
    throw new Error('store_news_media_too_large');
  }
  const mime = file.type || 'image/jpeg';
  if (!ALLOWED_STORE_NEWS_MIME.has(mime)) {
    throw new Error('store_news_media_type');
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || (mime === 'image/gif' ? 'gif' : 'jpg');
  const path = `${userId}/store-news/${storeId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: mime, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

export async function insertOwnerStoreNewsPost(
  storeId: string,
  payload: {
    image_url: string;
    image_crop?: Area | null;
    link_product_id: string | null;
    is_active: boolean;
    sort_order: number;
  },
): Promise<void> {
  const { error } = await supabase.from('store_news_posts').insert({
    store_id: storeId,
    title: '',
    body: null,
    image_url: payload.image_url.trim(),
    image_crop: payload.image_crop ?? null,
    link_product_id: payload.link_product_id,
    is_active: payload.is_active,
    sort_order: payload.sort_order,
  });
  if (error) throw error;
}

export async function updateOwnerStoreNewsPost(
  id: string,
  payload: Partial<{
    title: string;
    body: string | null;
    image_url: string | null;
    image_crop: Area | null;
    link_product_id: string | null;
    is_active: boolean;
    sort_order: number;
  }>,
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.title !== undefined) patch.title = payload.title.trim();
  if (payload.body !== undefined) patch.body = payload.body?.trim() || null;
  if (payload.image_url !== undefined) patch.image_url = payload.image_url?.trim() || null;
  if (payload.image_crop !== undefined) patch.image_crop = payload.image_crop;
  if (payload.link_product_id !== undefined) patch.link_product_id = payload.link_product_id;
  if (payload.is_active !== undefined) patch.is_active = payload.is_active;
  if (payload.sort_order !== undefined) patch.sort_order = payload.sort_order;
  const { error } = await supabase.from('store_news_posts').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteOwnerStoreNewsPost(id: string): Promise<void> {
  const { error } = await supabase.from('store_news_posts').delete().eq('id', id);
  if (error) throw error;
}
