/** Mobile-only domain types (DB snake_case) — @popup-cube/shared 와 동기화, Metro monorepo 충돌 방지 */

export type UserRole = 'shopper' | 'owner' | 'admin';

export type StoreStatus = 'draft' | 'published';

export interface StoreSummary {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  status: StoreStatus;
}
