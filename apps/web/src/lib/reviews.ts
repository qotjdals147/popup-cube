import type { ProductReview } from '@popup-cube/shared';
import { supabase } from './supabase';

/** §54 — 리뷰 사진 최대 크기/장수 */
export const MAX_REVIEW_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_REVIEW_IMAGES = 5;

export class ReviewError extends Error {}

/** 상품 상세페이지 — 공개 리뷰 목록 (평점/글/사진, 최신순). */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase.rpc('get_product_reviews', { p_product_id: productId });
  if (error) throw new ReviewError(error.message);
  return (data ?? []) as ProductReview[];
}

/** 손님 「내 주문」 — 이미 리뷰를 남긴 (주문, 상품) 조합. 버튼을 "리뷰 완료"로 바꾸는 용도. */
export async function getMyReviewKeys(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_my_review_keys');
  if (error) throw new ReviewError(error.message);
  const rows = (data ?? []) as { order_id: string; product_id: string }[];
  return new Set(rows.map((r) => reviewKey(r.order_id, r.product_id)));
}

export function reviewKey(orderId: string, productId: string): string {
  return `${orderId}:${productId}`;
}

async function uploadReviewImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/reviews/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage
    .from('store-assets')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) throw new ReviewError(error.message);

  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return data.publicUrl;
}

export interface SubmitReviewInput {
  orderId: string;
  productId: string;
  rating: number;
  body: string;
  imageFiles: File[];
}

/** 손님 — 구매확정된 주문의 상품에 리뷰 작성 (사진 먼저 업로드 후 RPC 한 번에 저장). */
export async function submitProductReview(userId: string, input: SubmitReviewInput): Promise<void> {
  const imageUrls: string[] = [];
  for (const file of input.imageFiles.slice(0, MAX_REVIEW_IMAGES)) {
    if (file.size > MAX_REVIEW_IMAGE_BYTES) continue;
    imageUrls.push(await uploadReviewImage(userId, file));
  }

  const { error } = await supabase.rpc('create_product_review', {
    p_order_id: input.orderId,
    p_product_id: input.productId,
    p_rating: input.rating,
    p_body: input.body,
    p_image_urls: imageUrls,
  });

  if (error) throw new ReviewError(error.message);
}
