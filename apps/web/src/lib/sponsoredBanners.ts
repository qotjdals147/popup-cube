import { supabase } from './supabase';

export interface SponsoredBannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  store_id: string | null;
  product_id: string | null;
  link_url: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SponsoredBannerInput = {
  title: string;
  subtitle: string | null;
  image_url: string;
  store_id: string | null;
  product_id: string | null;
  link_url: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export async function listPlatformSponsoredBanners(): Promise<SponsoredBannerRow[]> {
  const { data, error } = await supabase
    .from('sponsored_banners')
    .select(
      'id, title, subtitle, image_url, store_id, product_id, link_url, sort_order, starts_at, ends_at, is_active, created_at, updated_at',
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SponsoredBannerRow[];
}

export async function insertSponsoredBanner(input: SponsoredBannerInput): Promise<void> {
  const { error } = await supabase.from('sponsored_banners').insert({
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || null,
    image_url: input.image_url.trim(),
    store_id: input.store_id?.trim() || null,
    product_id: input.product_id || null,
    link_url: input.link_url?.trim() || null,
    sort_order: input.sort_order,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    is_active: input.is_active,
  });
  if (error) throw error;
}

export async function updateSponsoredBanner(id: string, input: Partial<SponsoredBannerInput>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle?.trim() || null;
  if (input.image_url !== undefined) patch.image_url = input.image_url.trim();
  if (input.store_id !== undefined) patch.store_id = input.store_id?.trim() || null;
  if (input.product_id !== undefined) patch.product_id = input.product_id || null;
  if (input.link_url !== undefined) patch.link_url = input.link_url?.trim() || null;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.starts_at !== undefined) patch.starts_at = input.starts_at;
  if (input.ends_at !== undefined) patch.ends_at = input.ends_at;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  const { error } = await supabase.from('sponsored_banners').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteSponsoredBanner(id: string): Promise<void> {
  const { error } = await supabase.from('sponsored_banners').delete().eq('id', id);
  if (error) throw error;
}

const MAX_BANNER_BYTES = 4 * 1024 * 1024;

export async function uploadSponsoredBannerImage(userId: string, file: File): Promise<string> {
  if (file.size > MAX_BANNER_BYTES) {
    throw new Error('banner_image_too_large');
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/platform-banners/${crypto.randomUUID()}.${safeExt}`;
  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}
