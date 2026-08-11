import { supabase } from './supabase';

/** 대표 이미지 업로드 최대 크기 (§26 P1) */
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024; // 5MB

export interface CreateStoreInput {
  name: string;
  storeCode: string;
  description: string;
  thumbnailFile: File;
}

export type CreateStoreErrorCode =
  | 'THUMBNAIL_TOO_LARGE'
  | 'UPLOAD_FAILED'
  | 'CREATE_FAILED';

export class CreateStoreError extends Error {
  code: CreateStoreErrorCode;
  constructor(code: CreateStoreErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

function generateStoreId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `store_${random}`;
}

async function uploadThumbnail(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) throw new CreateStoreError('UPLOAD_FAILED', error.message);

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * 매장 만들기(§26 P1). Storage 업로드 → DB 함수 `create_owner_store` 호출로
 * `stores` insert + `profiles.role/store_id` 갱신을 한 번에 원자적으로 처리.
 */
export async function createStore(
  userId: string,
  input: CreateStoreInput
): Promise<{ storeId: string }> {
  if (input.thumbnailFile.size > MAX_THUMBNAIL_BYTES) {
    throw new CreateStoreError('THUMBNAIL_TOO_LARGE');
  }

  const thumbnailUrl = await uploadThumbnail(userId, input.thumbnailFile);
  const storeId = generateStoreId();

  const { error } = await supabase.rpc('create_owner_store', {
    p_id: storeId,
    p_name: input.name.trim(),
    p_store_code: input.storeCode.trim(),
    p_description: input.description.trim(),
    p_thumbnail_url: thumbnailUrl,
  });

  if (error) throw new CreateStoreError('CREATE_FAILED', error.message);

  return { storeId };
}
