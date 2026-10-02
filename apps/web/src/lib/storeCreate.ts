import { supabase } from './supabase';
import { MAX_STORE_THUMBNAIL_BYTES, StoreThumbnailError, uploadStoreThumbnail } from './storeThumbnail';

/** @deprecated use MAX_STORE_THUMBNAIL_BYTES */
export const MAX_THUMBNAIL_BYTES = MAX_STORE_THUMBNAIL_BYTES;

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

/**
 * 매장 만들기(§26 P1). Storage 업로드 → DB 함수 `create_owner_store` 호출로
 * `stores` insert + `profiles.role/store_id` 갱신을 한 번에 원자적으로 처리.
 */
export async function createStore(
  userId: string,
  input: CreateStoreInput
): Promise<{ storeId: string }> {
  if (input.thumbnailFile.size > MAX_STORE_THUMBNAIL_BYTES) {
    throw new CreateStoreError('THUMBNAIL_TOO_LARGE');
  }

  let thumbnailUrl: string;
  try {
    thumbnailUrl = await uploadStoreThumbnail(userId, input.thumbnailFile);
  } catch (e) {
    if (e instanceof StoreThumbnailError && e.code === 'TOO_LARGE') {
      throw new CreateStoreError('THUMBNAIL_TOO_LARGE');
    }
    throw new CreateStoreError('UPLOAD_FAILED', e instanceof Error ? e.message : undefined);
  }
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
