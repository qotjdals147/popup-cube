import type { ProductDetailBlock } from '@popup-cube/shared';
import { supabase } from './supabase';

/** §56 (AD-060) — 상세페이지 블록 에디터: 글/이미지 블록 CRUD + 순서 저장. */
export const MAX_BLOCK_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DETAIL_BLOCKS = 40;

export type ProductDetailBlockErrorCode = 'IMAGE_TOO_LARGE' | 'TOO_MANY_BLOCKS' | 'UPLOAD_FAILED' | 'SAVE_FAILED';

export class ProductDetailBlockError extends Error {
  code: ProductDetailBlockErrorCode;
  constructor(code: ProductDetailBlockErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const BLOCK_SELECT = 'id, product_id, sort_order, block_type, text_content, image_url, created_at';

export async function listProductDetailBlocks(productId: string): Promise<ProductDetailBlock[]> {
  const { data, error } = await supabase
    .from('product_detail_blocks')
    .select(BLOCK_SELECT)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function uploadBlockImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/product-detail/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) throw new ProductDetailBlockError('UPLOAD_FAILED', error.message);

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

/** 점주 — 맨 뒤에 빈 글 블록 추가 (바로 이어서 입력). */
export async function addTextBlock(productId: string, sortOrder: number): Promise<ProductDetailBlock> {
  if (sortOrder >= MAX_DETAIL_BLOCKS) throw new ProductDetailBlockError('TOO_MANY_BLOCKS');

  const { data, error } = await supabase
    .from('product_detail_blocks')
    .insert({ product_id: productId, sort_order: sortOrder, block_type: 'text', text_content: '' })
    .select(BLOCK_SELECT)
    .single();

  if (error) throw new ProductDetailBlockError('SAVE_FAILED', error.message);
  return data as ProductDetailBlock;
}

/** 점주 — 맨 뒤에 이미지 블록 추가 (사진은 업로드 후 URL만 저장). */
export async function addImageBlock(
  userId: string,
  productId: string,
  file: File,
  sortOrder: number
): Promise<ProductDetailBlock> {
  if (file.size > MAX_BLOCK_IMAGE_BYTES) throw new ProductDetailBlockError('IMAGE_TOO_LARGE');
  if (sortOrder >= MAX_DETAIL_BLOCKS) throw new ProductDetailBlockError('TOO_MANY_BLOCKS');

  const imageUrl = await uploadBlockImage(userId, file);

  const { data, error } = await supabase
    .from('product_detail_blocks')
    .insert({ product_id: productId, sort_order: sortOrder, block_type: 'image', image_url: imageUrl })
    .select(BLOCK_SELECT)
    .single();

  if (error) throw new ProductDetailBlockError('SAVE_FAILED', error.message);
  return data as ProductDetailBlock;
}

export async function updateTextBlock(blockId: string, text: string): Promise<void> {
  const { error } = await supabase.from('product_detail_blocks').update({ text_content: text }).eq('id', blockId);
  if (error) throw new ProductDetailBlockError('SAVE_FAILED', error.message);
}

export async function deleteDetailBlock(blockId: string): Promise<void> {
  const { error } = await supabase.from('product_detail_blocks').delete().eq('id', blockId);
  if (error) throw new ProductDetailBlockError('SAVE_FAILED', error.message);
}

/** 드래그로 순서를 바꾼 뒤 — 전달된 순서(배열 인덱스)대로 sort_order를 일괄 저장. */
export async function reorderProductDetailBlocks(orderedBlockIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedBlockIds.map((id, index) =>
      supabase.from('product_detail_blocks').update({ sort_order: index }).eq('id', id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new ProductDetailBlockError('SAVE_FAILED', failed.error.message);
}
