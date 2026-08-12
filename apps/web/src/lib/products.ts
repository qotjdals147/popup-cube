import type { Product } from '@popup-cube/shared';
import { supabase } from './supabase';

/** 상품 이미지 업로드 최대 크기 (createStore 썸네일과 동일 기준) */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export type ProductErrorCode = 'IMAGE_TOO_LARGE' | 'UPLOAD_FAILED' | 'SAVE_FAILED';

export class ProductError extends Error {
  code: ProductErrorCode;
  constructor(code: ProductErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const PRODUCT_SELECT =
  'id, store_id, name, description, price, image_url, is_active, stock_quantity, auto_accept_enabled, auto_accept_limit, auto_accept_remaining, created_at, detail_description';

/**
 * 소비자용 — 특정 매장의 활성 상품만 조회 (RLS `products_public_read`).
 */
export async function listActiveProducts(storeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * 점주용 — 본인 매장 상품 전체 조회 (활성/비활성 모두, RLS `products_owner_read`).
 */
export async function listMyProducts(storeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function uploadProductImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/products/${Date.now()}.${ext}`;

  // store-assets 버킷 재사용 — RLS가 본인 uid 폴더로만 업로드를 허용해서 신규 버킷 없이 그대로 씀.
  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) throw new ProductError('UPLOAD_FAILED', error.message);

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

export interface CreateProductInput {
  storeId: string;
  name: string;
  description: string;
  price: number;
  imageFile: File | null;
}

/**
 * 점주 상품 등록. 이미지가 있으면 먼저 업로드하고, 없으면 `image_url`은 null로 저장.
 */
export async function createProduct(userId: string, input: CreateProductInput): Promise<Product> {
  if (input.imageFile && input.imageFile.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new ProductError('IMAGE_TOO_LARGE');
  }

  const imageUrl = input.imageFile ? await uploadProductImage(userId, input.imageFile) : null;

  const { data, error } = await supabase
    .from('products')
    .insert({
      store_id: input.storeId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      price: input.price,
      image_url: imageUrl,
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw new ProductError('SAVE_FAILED', error.message);
  return data as Product;
}

export interface ProductFulfillmentInput {
  stockQuantity: number;
  autoAcceptEnabled: boolean;
  autoAcceptLimit: number;
}

export async function updateProductFulfillment(
  productId: string,
  input: ProductFulfillmentInput
): Promise<void> {
  const { error } = await supabase.rpc('update_product_fulfillment', {
    p_product_id: productId,
    p_stock_quantity: input.stockQuantity,
    p_auto_accept_enabled: input.autoAcceptEnabled,
    p_auto_accept_limit: input.autoAcceptLimit,
  });
  if (error) throw new ProductError('SAVE_FAILED', error.message);
}

/** 상품 활성/비활성 토글 (soft delete — 손님 화면에서만 숨김, 주문 이력 보존을 위해 실제 삭제는 하지 않음). */
export async function setProductActive(productId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', productId);
  if (error) throw new ProductError('SAVE_FAILED', error.message);
}

/** §54 — 상세페이지에 직접 쓰는 긴 설명 글 저장 (RLS `products_owner_update` 재사용). */
export async function updateProductDetailDescription(productId: string, detailDescription: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ detail_description: detailDescription.trim() || null })
    .eq('id', productId);
  if (error) throw new ProductError('SAVE_FAILED', error.message);
}

export interface UpdateProductInput {
  name: string;
  description: string;
  price: number;
  imageFile?: File | null;
}

export async function updateProduct(
  userId: string,
  productId: string,
  input: UpdateProductInput
): Promise<void> {
  const patch: {
    name: string;
    description: string | null;
    price: number;
    image_url?: string;
  } = {
    name: input.name.trim(),
    description: input.description.trim() || null,
    price: input.price,
  };

  if (input.imageFile) {
    if (input.imageFile.size > MAX_PRODUCT_IMAGE_BYTES) {
      throw new ProductError('IMAGE_TOO_LARGE');
    }
    patch.image_url = await uploadProductImage(userId, input.imageFile);
  }

  const { error } = await supabase.from('products').update(patch).eq('id', productId);

  if (error) throw new ProductError('SAVE_FAILED', error.message);
}
