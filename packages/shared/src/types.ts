/**
 * Shared domain types — used by both apps/web and server.
 * Keep in sync with Supabase schema (see HANDOFF_POPUP_STORE.md §10).
 */

import type { ProductPromoMode, StoreDefaultPromoMode } from './promo';

export type UserRole = 'shopper' | 'owner' | 'admin';

export interface Profile {
  id: string;
  email: string;
  username: string;
  /** 게임 안에서 보이는 캐릭터 닉네임 (중복 불가). 구버전 계정은 null일 수 있음 → username으로 대체. */
  nickname: string | null;
  role: UserRole;
  storeId: string | null;
  avatarConfig: Record<string, unknown>;
  createdAt: string;
}

export interface MapObject {
  x: number;
  y: number;
  assetId: string;
  isCollidable: boolean;
}

export interface MapFloorTile {
  x: number;
  y: number;
  tileId: string;
}

export interface MapConfig {
  storeId: string;
  mapSize: { width: number; height: number };
  layers: {
    floor: MapFloorTile[];
    objects: MapObject[];
  };
}

export interface Store {
  id: string;
  name: string;
  ownerId: string | null;
  mapConfig: MapConfig;
  maxChannelCapacity: number;
  isActive: boolean;
  popupEndsAt: string | null;
}

export type StoreStatus = 'draft' | 'published';

/** §53 P0#9 — 배송비 규칙 */
export type StoreShippingFeeType = 'free' | 'flat' | 'conditional_free';

/** §53 P0#8·#9 — 매장 운영·배송 정책 (stores 테이블 1:1) */
export interface StorePolicy {
  cs_phone: string | null;
  cs_email: string | null;
  return_recipient_name: string | null;
  return_phone: string | null;
  return_postal_code: string | null;
  return_address_line1: string | null;
  return_address_line2: string | null;
  shipping_guide: string | null;
  exchange_return_guide: string | null;
  /** AD-073 R2 — 단순변심 반품 허용 */
  return_change_of_mind_allowed: boolean;
  /** AD-073 R2 — 구매확정(또는 배송완료) 후 N일 */
  return_change_of_mind_days: number;
  /** AD-073 R2 — 교환 허용 */
  exchange_allowed: boolean;
  shipping_fee_type: StoreShippingFeeType;
  shipping_fee_amount: number;
  shipping_free_threshold: number;
}

/**
 * 홈 허브(§26)에서 매장 카드·입장 모달에 쓰는 요약 정보.
 * DB 컬럼명(snake_case)을 그대로 사용 — Supabase 클라이언트 조회 결과와 1:1.
 */
export interface StoreSummary extends StorePolicy {
  id: string;
  name: string;
  /** 주문번호 접두어 — 영문·숫자 (예: GUCCI). 사람용 주문번호 = `{store_code}-{order_number}` */
  store_code: string;
  description: string | null;
  thumbnail_url: string | null;
  status: StoreStatus;
  /** §58 — 팝업 종료 시각 (null = 기간 뱃지 없음) */
  popup_ends_at: string | null;
  /** 매장 개설일 — 점주 주문 필터 A(시작) 기준 */
  created_at?: string | null;
}

/**
 * 상품 등록/목록 MVP(§10)에서 쓰는 상품 정보.
 * DB 컬럼명(snake_case)을 그대로 사용 — Supabase 클라이언트 조회 결과와 1:1.
 * price는 원(KRW) 단위 정수(소수점 없음).
 */
export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  stock_quantity: number;
  auto_accept_enabled: boolean;
  auto_accept_limit: number;
  auto_accept_remaining: number;
  created_at: string;
  /** §54 — 상세페이지에 직접 쓰는 긴 설명 글 (선택, 상세 이미지와 함께/대신 사용) */
  detail_description: string | null;
  /** AD-028 v1b — inherit=매장 기본 · none/discount_only/gacha_only/choice */
  promo_mode: ProductPromoMode;
  /** 상품별 할인 % (discount_only/choice, null이면 매장 기본 %) */
  promo_discount_percent: number | null;
}

/** §54 — 상품 상세페이지 이미지 1장 (여러 장을 세로로 쌓아 표시). @deprecated §56 블록 에디터로 대체 — 레거시 데이터 호환용으로만 남김. */
export interface ProductDetailImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export type ProductDetailBlockType = 'text' | 'image';

/**
 * §56 (AD-060) — 상품 상세페이지 블록 1개. 글/이미지 블록을 `sort_order`대로 이어붙여
 * 워드/구글독스처럼 자유롭게 배치·재정렬할 수 있게 함 (`product_detail_blocks` 테이블).
 */
export interface ProductDetailBlock {
  id: string;
  product_id: string;
  sort_order: number;
  block_type: ProductDetailBlockType;
  text_content: string | null;
  image_url: string | null;
  created_at: string;
}

/** §54 — 상품 리뷰 1건 (구매확정된 주문에서만 작성 가능, `create_product_review` RPC). */
export interface ProductReview {
  review_id: string;
  rating: number;
  body: string;
  created_at: string;
  reviewer_nickname: string | null;
  image_urls: string[];
}

/** 장바구니 담기 MVP(§10) — 아직 서버/DB에 저장하지 않는 클라이언트 전용 상태. */
export interface CartItem {
  productId: string;
  storeId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

/** 매장별 프로모션 기본 설정 (AD-028, §10). */
export interface StorePromotion {
  store_id: string;
  discount_percent: number;
  is_active: boolean;
  /** 매장 기본 혜택 — 상품 inherit 시 적용 */
  default_promo_mode: StoreDefaultPromoMode;
}

/**
 * 가챠 뽑기 결과 (AD-028, §10) — `roll_gacha` RPC 응답.
 * `product_id`가 있으면 실제 상품 당첨, 없으면 가챠 전용 아이템(`exclusive_name`).
 */
export interface GachaRollResult {
  entry_id: string;
  product_id: string | null;
  product_name: string | null;
  product_image_url: string | null;
  exclusive_name: string | null;
  exclusive_image_url: string | null;
}

/** 소비자 배송지 (AD-030, §10) — 마이페이지에서 여러 개 등록, 결제 시 선택. */
export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  postal_code: string;
  address_line1: string;
  address_line2: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type NewAddressInput = Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/** 점주 반품·교환 수령지 (AD-076) — 매장별 여러 개 + 기본 반품지. */
export interface StoreReturnAddress {
  id: string;
  store_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  postal_code: string;
  address_line1: string;
  address_line2: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type NewStoreReturnAddressInput = Omit<
  StoreReturnAddress,
  'id' | 'store_id' | 'created_at' | 'updated_at'
>;

export type RewardType = 'discount' | 'gacha';
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'awaiting_accept'
  | 'on_hold'
  | 'accepted'
  | 'rejected'
  | 'shipped'
  | 'delivery_completed'
  | 'purchase_confirmed'
  | 'completed'
  | 'cancelled';

/** §53 P0#8 — 주문 취소자 (점주 거절 vs 손님 발송전 취소) */
export type OrderCancelledBy = 'owner' | 'shopper';

/** §53 P0#8 — 배송중~구매확정 주문 클레임(문의) v1 뼈대: 주문당 활성 클레임 1건 */
export type OrderClaimStatus = 'none' | 'open' | 'resolved';

/** AD-073 R2 — 반품·교환 신청 상태 (orders.return_status 캐시) */
export type OrderReturnStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'completed';

/** AD-073 R2 — 반품 vs 교환 */
export type OrderReturnKind = 'return' | 'exchange';

/** AD-073 R2 — 가챠 당첨품 반납 상태 (§7.49) */
export type GachaReturnStatus = 'pending' | 'returned' | 'not_returnable';

/** 주문 헤더 (AD-030, §10) — `place_order()` 서버 함수로만 생성 (가격 조작 방지). */
export interface Order {
  id: string;
  store_id: string;
  user_id: string;
  shipping_address_id: string | null;
  /** 할인 적용 후 상품 합계 (배송비 제외) */
  subtotal_amount: number | null;
  /** 주문 시점 배송비 스냅샷 */
  shipping_fee: number;
  total_amount: number;
  discount_percent: number | null;
  reward_type: RewardType;
  status: OrderStatus;
  auto_accepted: boolean;
  accepted_at: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  /** AD-054 — 점주 배송 완료 처리 시각 */
  delivery_completed_at: string | null;
  /** AD-054 — 손님 구매확정(수동) 또는 주문일+7일 자동 확정 시각 */
  purchase_confirmed_at: string | null;
  /** AD-054 — 손님이 직접 누르지 않고 주문일+7일 자동으로 확정된 건인지 */
  purchase_confirm_auto: boolean;
  /** 매장별 순번 — 사람용 주문번호의 숫자 부분 (§53 P0#7) */
  order_number: number;
  /** §53 P0#8 — 손님이 발송 전 직접 취소했을 때만 채워짐 */
  cancelled_at: string | null;
  cancelled_by: OrderCancelledBy | null;
  /** §53 P0#8 — 클레임(문의) v1 뼈대 */
  claim_status: OrderClaimStatus;
  claim_message: string | null;
  claim_reply: string | null;
  claim_created_at: string | null;
  claim_resolved_at: string | null;
  /** AD-077 — 문의 라운드 수 (2+ 이면 이력 보기) */
  claim_round_count: number;
  /** AD-073 R2 — 반품·교환 신청 캐시 */
  return_status: OrderReturnStatus;
  return_kind: OrderReturnKind | null;
  return_reason_code: string | null;
  return_reason_detail: string | null;
  return_requested_at: string | null;
  return_resolved_at: string | null;
  return_owner_reply: string | null;
  active_return_id: string | null;
  /** AD-069 — 점주 보류(보완 요청) */
  hold_reason_code: string | null;
  hold_reason_text: string | null;
  hold_requested_at: string | null;
  hold_affected_item_ids: string[] | null;
  supplement_submitted_at: string | null;
  /** AD-069 — 점주 거절/취소 사유 (손님 노출) */
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  created_at: string;
}

/** 주문 라인 — 상품별 수량·주문 시점 단가 스냅샷. */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

/** 점주·손님 주문 라인 조인 (상품명 · §60 4-D 썸네일). */
export interface OwnerOrderItemView {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string | null;
  quantity: number;
  unit_price: number;
}

export interface OwnerOrderView extends Order {
  /** 주문번호 접두어 (stores.store_code) */
  store_code: string;
  buyer_nickname: string | null;
  shipping_label: string | null;
  shipping_recipient_name: string | null;
  shipping_phone: string | null;
  shipping_postal_code: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  items: OwnerOrderItemView[];
  /** `reward_type=gacha` — same order card (AD-028, order_id on gacha_rolls) */
  gacha_prize_name: string | null;
  gacha_prize_image_url: string | null;
  gacha_prize_is_product: boolean;
}

/** 손님 「내 주문」 화면에서 쓰는 조인 결과 (AD-054, §52.7). */
export interface ShopperOrderView extends Order {
  store_name: string | null;
  /** 주문번호 접두어 (stores.store_code) */
  store_code: string | null;
  items: OwnerOrderItemView[];
  gacha_prize_name: string | null;
  gacha_prize_image_url: string | null;
}

/** AD-076 — 손님 알림 목록 (`list_my_notifications`) */
export interface ShopperNotificationView {
  id: string;
  order_id: string | null;
  event_type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  store_code: string | null;
  order_number: number | null;
}

/** AD-073 R2 — 반품·교환 신청 1건 상세 */
export interface OrderReturnDetail {
  return_id: string;
  order_id: string;
  kind: OrderReturnKind;
  reason_code: string;
  reason_detail: string | null;
  status: OrderReturnStatus;
  items: { order_item_id: string; quantity: number }[];
  exchange_memo: string | null;
  return_recipient_name: string | null;
  return_phone: string | null;
  return_postal_code: string | null;
  return_address_line1: string | null;
  return_address_line2: string | null;
  gacha_return_status: GachaReturnStatus | null;
  owner_reply: string | null;
  evidence_urls?: string[];
  requested_at: string;
  resolved_at: string | null;
}

export interface ChannelInfo {
  number: number;
  roomKey: string;
  visitorCount: number;
  maxCapacity: number;
}

export interface PlayerState {
  userId: string;
  username: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  /** 이 매장의 점주 본인 캐릭터인지 (이름표 왕관 표시용). */
  isOwner?: boolean;
}

/** Socket.io event contracts — see HANDOFF_POPUP_STORE.md §12 */
export interface StoreJoinRequest {
  storeId: string;
  userId: string;
  username: string;
  x?: number;
  y?: number;
  direction?: PlayerState['direction'];
}

export interface StoreJoinResponse {
  ok: boolean;
  error?: string;
  store?: Pick<Store, 'id' | 'name' | 'mapConfig' | 'popupEndsAt'>;
  channel?: ChannelInfo;
  players?: PlayerState[];
  self?: { x: number; y: number; direction: PlayerState['direction']; isOwner?: boolean };
}

/** §42.3 / §44 — 플랫폼 진열 조형물 카탈로그 (fixture_templates). */
export interface FixtureTemplate {
  id: string;
  display_name: string;
  slot_count: number;
  size_w: number;
  size_d: number;
  sort_order: number;
  sprite_key: string | null;
  interaction_kind: string;
  is_active: boolean;
}

/** 매장에 배치된 조형물 1개 (display_fixtures). */
export interface DisplayFixture {
  id: string;
  store_id: string;
  template_id: string;
  origin_x: number;
  origin_y: number;
  rotation: 0 | 90 | 180 | 270;
  label: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** 조형물 슬롯 — 상품 연결 (display_slots). */
export interface DisplaySlot {
  id: string;
  fixture_id: string;
  slot_index: number;
  product_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface DisplayFixtureWithTemplate extends DisplayFixture {
  template: FixtureTemplate;
}

export interface DisplaySlotWithProduct extends DisplaySlot {
  product?: Product | null;
}
