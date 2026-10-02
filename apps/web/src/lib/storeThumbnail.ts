import { supabase } from './supabase';

export const MAX_STORE_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export class StoreThumbnailError extends Error {
  constructor(
    public readonly code: 'TOO_LARGE' | 'UPLOAD_FAILED' | 'UPDATE_FAILED',
    message?: string,
  ) {
    super(message ?? code);
  }
}

export async function uploadStoreThumbnail(userId: string, file: File | Blob): Promise<string> {
  if (file.size > MAX_STORE_THUMBNAIL_BYTES) {
    throw new StoreThumbnailError('TOO_LARGE');
  }

  const ext = file instanceof File ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
  const path = `${userId}/store-thumb-${Date.now()}.${ext === 'png' ? 'png' : 'jpg'}`;

  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) throw new StoreThumbnailError('UPLOAD_FAILED', error.message);

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}
