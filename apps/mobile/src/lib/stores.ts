import type { StoreSummary } from '../types/domain';
import { getSupabase } from './supabase';

export async function listPublishedStores(search?: string): Promise<StoreSummary[]> {
  let query = getSupabase()
    .from('stores')
    .select('id, name, description, thumbnail_url, status')
    .eq('is_active', true)
    .eq('status', 'published')
    .order('name', { ascending: true });

  const trimmed = search?.trim();
  if (trimmed) {
    query = query.ilike('name', `%${trimmed}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getStoreSummary(storeId: string): Promise<StoreSummary | null> {
  const { data, error } = await getSupabase()
    .from('stores')
    .select('id, name, description, thumbnail_url, status')
    .eq('id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
