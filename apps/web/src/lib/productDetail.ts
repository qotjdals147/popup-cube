import type { ProductDetailImage } from '@popup-cube/shared';
import { supabase } from './supabase';

/** §54 — 상세페이지 이미지 최대 크기/장수 (상품 썸네일과 동일 기준 재사용) */
export const MAX_DETAIL_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DETAIL_IMAGES = 12;

export type ProductDetailErrorCode = 'IMAGE_TOO_LARGE' | 'TOO_MANY_IMAGES' | 'UPLOAD_FAILED' | 'SAVE_FAILED';

export class ProductDetailError extends Error {
  code: ProductDetailErrorCode;
  constructor(code: ProductDetailErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const DETAIL_IMAGE_SELECT = 'id, product_id, image_url, sort_order, created_at';

export async function listProductDetailImages(productId: string): Promise<ProductDetailImage[]> {
  const { data, error } = await supabase
    .from('product_detail_images')
    .select(DETAIL_IMAGE_SELECT)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function uploadDetailImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/product-detail/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) throw new ProductDetailError('UPLOAD_FAILED', error.message);

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

/** 점주 — 상세페이지 이미지 추가 (맨 뒤에 붙음). */
export async function addProductDetailImage(
  userId: string,
  productId: string,
  file: File,
  currentCount: number
): Promise<ProductDetailImage> {
  if (file.size > MAX_DETAIL_IMAGE_BYTES) {
    throw new ProductDetailError('IMAGE_TOO_LARGE');
  }
  if (currentCount >= MAX_DETAIL_IMAGES) {
    throw new ProductDetailError('TOO_MANY_IMAGES');
  }

  const imageUrl = await uploadDetailImage(userId, file);

  const { data, error } = await supabase
    .from('product_detail_images')
    .insert({ product_id: productId, image_url: imageUrl, sort_order: currentCount })
    .select(DETAIL_IMAGE_SELECT)
    .single();

  if (error) throw new ProductDetailError('SAVE_FAILED', error.message);
  return data as ProductDetailImage;
}

export async function deleteProductDetailImage(imageId: string): Promise<void> {
  const { error } = await supabase.from('product_detail_images').delete().eq('id', imageId);
  if (error) throw new ProductDetailError('SAVE_FAILED', error.message);
}

/** 점주 — 이미지 순서 맞바꾸기 (위/아래 화살표 버튼용, sort_order 2건 스왑). */
export async function swapProductDetailImageOrder(
  a: ProductDetailImage,
  b: ProductDetailImage
): Promise<void> {
  const [{ error: errA }, { error: errB }] = await Promise.all([
    supabase.from('product_detail_images').update({ sort_order: b.sort_order }).eq('id', a.id),
    supabase.from('product_detail_images').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);
  if (errA || errB) throw new ProductDetailError('SAVE_FAILED', (errA ?? errB)?.message);
}
