import { supabase } from './supabase';

export interface StoreNewsPost {
  id: string;
  title: string;
  body: string | null;
  sort_order: number;
  created_at: string;
  is_active?: boolean;
}

export async function getStoreNewsForShop(storeId: string, limit = 8): Promise<StoreNewsPost[]> {
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
    .select('id, title, body, sort_order, created_at, is_active')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StoreNewsPost[];
}

export async function insertOwnerStoreNewsPost(
  storeId: string,
  payload: { title: string; body: string | null; is_active: boolean; sort_order: number }
): Promise<void> {
  const { error } = await supabase.from('store_news_posts').insert({
    store_id: storeId,
    title: payload.title.trim(),
    body: payload.body?.trim() || null,
    is_active: payload.is_active,
    sort_order: payload.sort_order,
  });
  if (error) throw error;
}

export async function updateOwnerStoreNewsPost(
  id: string,
  payload: Partial<{ title: string; body: string | null; is_active: boolean; sort_order: number }>
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.title !== undefined) patch.title = payload.title.trim();
  if (payload.body !== undefined) patch.body = payload.body?.trim() || null;
  if (payload.is_active !== undefined) patch.is_active = payload.is_active;
  if (payload.sort_order !== undefined) patch.sort_order = payload.sort_order;
  const { error } = await supabase.from('store_news_posts').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteOwnerStoreNewsPost(id: string): Promise<void> {
  const { error } = await supabase.from('store_news_posts').delete().eq('id', id);
  if (error) throw error;
}
