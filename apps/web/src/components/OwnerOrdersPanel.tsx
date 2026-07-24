import { useEffect, useState } from 'react';
import type { OwnerOrderView } from '@popup-cube/shared';
import { listStoreOrders } from '../lib/orders';
import { t } from '../i18n';

interface OwnerOrdersPanelProps {
  storeId: string;
  onClose: () => void;
}

/**
 * 점주용 주문 관리 화면 — 실제 저장된 주문(mock 결제지만 DB엔 진짜 기록, §10) 목록.
 * 구매자 닉네임·배송지는 `get_store_orders` 서버 함수가 본인 매장 소유 여부를 검증한 뒤 반환.
 */
export function OwnerOrdersPanel({ storeId, onClose }: OwnerOrdersPanelProps) {
  const [orders, setOrders] = useState<OwnerOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    listStoreOrders(storeId)
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('ownerOrders.title')}</h3>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && <p style={styles.hint}>{t('ownerOrders.loading')}</p>}
        {!loading && error && <p style={styles.error}>{t('ownerOrders.errorLoad')}</p>}
        {!loading && !error && orders.length === 0 && <p style={styles.hint}>{t('ownerOrders.empty')}</p>}

        {!loading && !error && orders.length > 0 && (
          <div style={styles.list}>
            {orders.map((order) => (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.buyer}>
                    {t('ownerOrders.buyer')}: {order.buyer_nickname ?? '-'}
                  </span>
                  <span style={styles.rewardBadge}>
                    {order.reward_type === 'discount'
                      ? t('ownerOrders.rewardDiscount', { percent: order.discount_percent ?? 0 })
                      : t('ownerOrders.rewardGacha')}
                  </span>
                </div>

                <div style={styles.itemsRow}>{t('ownerOrders.itemsCount', { count: order.items.length })}</div>
                {order.items.map((item) => (
                  <div key={item.id} style={styles.itemLine}>
                    {item.product_name} × {item.quantity}
                  </div>
                ))}

                <div style={styles.shippingBox}>
                  <div style={styles.shippingLabel}>{t('ownerOrders.shippingTo')}</div>
                  {order.shipping_recipient_name ? (
                    <div style={styles.shippingText}>
                      {order.shipping_recipient_name} · {order.shipping_phone} <br />({order.shipping_postal_code}){' '}
                      {order.shipping_address_line1} {order.shipping_address_line2 ?? ''}
                    </div>
                  ) : (
                    <div style={styles.shippingText}>{t('ownerOrders.noAddress')}</div>
                  )}
                </div>

                <div style={styles.footerRow}>
                  <span style={styles.date}>{formatDate(order.created_at)}</span>
                  <strong style={styles.total}>{formatPrice(order.total_amount)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    padding: 16,
  },
  panel: {
    background: '#16213e',
    borderRadius: 14,
    width: '100%',
    maxWidth: 560,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: 20,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#fff', fontSize: 17, margin: 0 },
  closeButton: { background: 'transparent', border: 'none', color: '#a0a0c0', fontSize: 16, cursor: 'pointer' },
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#0f3460', borderRadius: 10, padding: 14, border: '1px solid #2c4270' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  buyer: { color: '#fff', fontSize: 13, fontWeight: 600 },
  rewardBadge: {
    fontSize: 11,
    color: '#d8e4ff',
    border: '1px solid #4062a0',
    borderRadius: 999,
    padding: '2px 8px',
  },
  itemsRow: { color: '#9db2df', fontSize: 12, marginBottom: 4 },
  itemLine: { color: '#c9d4ee', fontSize: 12, marginBottom: 2 },
  shippingBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    background: '#0d1730',
  },
  shippingLabel: { color: '#8ca4d8', fontSize: 11, marginBottom: 3 },
  shippingText: { color: '#c9d4ee', fontSize: 12, lineHeight: 1.5 },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px solid #2c4270',
  },
  date: { color: '#8ca4d8', fontSize: 11 },
  total: { color: '#e94560', fontSize: 14 },
};
