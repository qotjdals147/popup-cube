import type { OrderStatus } from '@popup-cube/shared';
import type React from 'react';

/** 주문 상태별 뱃지 색 (점주 관리센터) */
export function orderStatusBadgeStyle(status: OrderStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 999,
    padding: '3px 10px',
    whiteSpace: 'nowrap',
    lineHeight: 1.3,
  };

  switch (status) {
    case 'awaiting_accept':
    case 'pending':
    case 'paid':
      return { ...base, background: '#fff9db', color: '#e67700', border: '1px solid #ffe066' };
    case 'on_hold':
      return { ...base, background: '#fff4e6', color: '#d9480f', border: '1px solid #ffc078' };
    case 'accepted':
      return { ...base, background: '#eef4ff', color: '#2563eb', border: '1px solid #bfdbfe' };
    case 'shipped':
      return { ...base, background: '#f3f0ff', color: '#6741d9', border: '1px solid #d0bfff' };
    case 'delivery_completed':
      return { ...base, background: '#e3fafc', color: '#0c8599', border: '1px solid #99e9f2' };
    case 'purchase_confirmed':
    case 'completed':
      return { ...base, background: '#ebfbee', color: '#087f5b', border: '1px solid #b2f2bb' };
    case 'rejected':
    case 'cancelled':
      return { ...base, background: '#fff5f5', color: '#c92a2a', border: '1px solid #ffc9c9' };
    default:
      return { ...base, background: '#f2f4f6', color: '#4e5968', border: '1px solid #d1d6db' };
  }
}
