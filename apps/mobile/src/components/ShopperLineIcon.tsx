import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type ShopperLineIconName =
  | 'home'
  | 'person'
  | 'bag'
  | 'bell'
  | 'search'
  | 'settings'
  | 'receipt'
  | 'location'
  | 'time'
  | 'moon';

type IonName = ComponentProps<typeof Ionicons>['name'];

function ionName(name: ShopperLineIconName, active?: boolean): IonName {
  switch (name) {
    case 'home':
      return active ? 'home' : 'home-outline';
    case 'person':
      return active ? 'person' : 'person-outline';
    case 'bag':
      return active ? 'bag-handle' : 'bag-handle-outline';
    case 'bell':
      return 'notifications-outline';
    case 'search':
      return 'search-outline';
    case 'settings':
      return 'settings-outline';
    case 'receipt':
      return 'receipt-outline';
    case 'location':
      return 'location-outline';
    case 'time':
      return 'time-outline';
    case 'moon':
      return 'moon-outline';
    default:
      return 'ellipse-outline';
  }
}

interface ShopperLineIconProps {
  name: ShopperLineIconName;
  size?: number;
  color: string;
  /** 하단 탭 등 — 선택 탭만 채움(에이블리형) */
  active?: boolean;
}

/** 손님 앱 — 쇼핑몰형 **라인 아이콘** (이모지·입체 이모티콘 ❌ · AD-088 · CEO 2026-10-02) */
export function ShopperLineIcon({ name, size = 24, color, active }: ShopperLineIconProps) {
  return <Ionicons name={ionName(name, active)} size={size} color={color} />;
}
