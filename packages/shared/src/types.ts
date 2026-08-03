/**
 * Shared domain types — used by both apps/web and server.
 * Keep in sync with Supabase schema (see HANDOFF_POPUP_STORE.md §10).
 */

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

/**
 * 홈 허브(§26)에서 매장 카드·입장 모달에 쓰는 요약 정보.
 * DB 컬럼명(snake_case)을 그대로 사용 — Supabase 클라이언트 조회 결과와 1:1.
 */
export interface StoreSummary {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  status: StoreStatus;
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

/** 매장별 할인 프로모션 설정 (AD-028, §10). MVP: 고정 퍼센트 하나. */
export interface StorePromotion {
  store_id: string;
  discount_percent: number;
  is_active: boolean;
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

export type RewardType = 'discount' | 'gacha';
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'awaiting_accept'
  | 'accepted'
  | 'rejected'
  | 'shipped'
  | 'completed'
  | 'cancelled';

/** 주문 헤더 (AD-030, §10) — `place_order()` 서버 함수로만 생성 (가격 조작 방지). */
export interface Order {
  id: string;
  store_id: string;
  user_id: string;
  shipping_address_id: string | null;
  total_amount: number;
  discount_percent: number | null;
  reward_type: RewardType;
  status: OrderStatus;
  auto_accepted: boolean;
  accepted_at: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
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

/** 점주 주문 관리 화면에서 쓰는 조인 결과 (상품명·구매자 닉네임 포함). */
export interface OwnerOrderItemView {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface OwnerOrderView extends Order {
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
