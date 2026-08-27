import { useEffect, useMemo, useState } from 'react';
import type { HoldReasonCode, ShopperOrderView } from '@popup-cube/shared';
import { holdReasonLabelKey } from '@popup-cube/shared';
import { listMyAddresses } from '../lib/addresses';
import { submitOrderSupplement, OrderError } from '../lib/orders';
import { rollGacha } from '../lib/gacha';
import { t } from '../i18n';

interface OrderHoldSupplementSectionProps {
  order: ShopperOrderView;
  actionId: string | null;
  onActionStart: (orderId: string) => void;
  onActionEnd: () => void;
  onReload: () => Promise<void>;
  onCancelOrder: (orderId: string) => void;
}

/** AD-069 — 손님 보류 주문: 사유별 보완 UI */
export function OrderHoldSupplementSection({
  order,
  actionId,
  onActionStart,
  onActionEnd,
  onReload,
  onCancelOrder,
}: OrderHoldSupplementSectionProps) {
  const reason = order.hold_reason_code as HoldReasonCode | null;
  const [addresses, setAddresses] = useState<{ id: string; label: string; line: string }[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [qtyDraft, setQtyDraft] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const affectedIds = useMemo(
    () => new Set(order.hold_affected_item_ids ?? []),
    [order.hold_affected_item_ids],
  );

  const affectedItems = order.items.filter((i) => affectedIds.has(i.id));

  useEffect(() => {
    if (reason !== 'address_issue') return;
    void listMyAddresses()
      .then((rows) => {
        setAddresses(
          rows.map((a) => ({
            id: a.id,
            label: a.label,
            line: `(${a.postal_code}) ${a.address_line1}`,
          })),
        );
        const current = order.shipping_address_id;
        if (current) setSelectedAddressId(current);
        else if (rows[0]) setSelectedAddressId(rows[0].id);
      })
      .catch(() => setAddresses([]));
  }, [reason, order.shipping_address_id]);

  useEffect(() => {
    if (reason !== 'line_stock_short') return;
    const init: Record<string, number> = {};
    for (const item of affectedItems) {
      init[item.id] = Math.max(0, item.quantity - 1);
    }
    setQtyDraft(init);
  }, [reason, affectedItems]);

  if (order.status !== 'on_hold' || !reason) return null;

  async function submit(payload: Record<string, unknown>, needsGachaRoll = false) {
    onActionStart(order.id);
    setError(null);
    try {
      const result = await submitOrderSupplement(order.id, payload);
      if (needsGachaRoll || result.needsGachaRoll) {
        await rollGacha(order.store_id, order.id);
      }
      await onReload();
    } catch (err) {
      setError(err instanceof OrderError ? err.message : t('orderHold.supplementError'));
    } finally {
      onActionEnd();
    }
  }

  return (
    <section className="oh-hold-box">
      <div className="oh-hold-title">{t('orderHold.title')}</div>

      <div className="oh-hold-reason-card">
        <div className="oh-hold-kicker">{t('orderHold.storeNoticeLabel')}</div>
        <div className="oh-hold-reason-main">{t(holdReasonLabelKey(reason))}</div>
        {order.hold_reason_text ? (
          <p className="oh-hold-memo">{order.hold_reason_text}</p>
        ) : null}
      </div>

      <div className="oh-hold-action-card">
        <div className="oh-hold-kicker">{t('orderHold.actionStepLabel')}</div>
        <p className="oh-hold-hint">{t(`orderHold.actionHint.${reason}`)}</p>
      </div>

      {reason === 'address_issue' && (
        <div className="oh-hold-form">
          <label className="oh-hold-label">{t('orderHold.pickAddress')}</label>
          <select
            className="oh-hold-select"
            value={selectedAddressId}
            onChange={(e) => setSelectedAddressId(e.target.value)}
          >
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} · {a.line}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="oh-primary-btn"
            disabled={actionId === order.id || !selectedAddressId}
            onClick={() => void submit({ address_id: selectedAddressId })}
          >
            {t('orderHold.submitSupplement')}
          </button>
        </div>
      )}

      {reason === 'line_stock_short' && (
        <div className="oh-hold-form">
          {affectedItems.map((item) => (
            <div key={item.id} className="oh-hold-qty-row">
              <span>{item.product_name}</span>
              <input
                type="number"
                className="oh-hold-qty-input"
                min={0}
                max={item.quantity - 1}
                value={qtyDraft[item.id] ?? 0}
                onChange={(e) =>
                  setQtyDraft((prev) => ({
                    ...prev,
                    [item.id]: Math.min(item.quantity - 1, Math.max(0, Number(e.target.value) || 0)),
                  }))
                }
              />
              <span className="oh-hold-qty-max">/ {item.quantity}</span>
            </div>
          ))}
          <button
            type="button"
            className="oh-primary-btn"
            disabled={actionId === order.id}
            onClick={() =>
              void submit({
                items: affectedItems.map((item) => ({
                  item_id: item.id,
                  quantity: qtyDraft[item.id] ?? 0,
                })),
              })
            }
          >
            {t('orderHold.submitSupplement')}
          </button>
        </div>
      )}

      {reason === 'gacha_prize_oos' && (
        <div className="oh-hold-form oh-hold-gacha-actions">
          <button
            type="button"
            className="oh-primary-btn"
            disabled={actionId === order.id}
            onClick={() => void submit({ gacha_action: 'reroll' }, true)}
          >
            {t('orderHold.gachaReroll')}
          </button>
          <button
            type="button"
            className="oh-secondary-btn"
            disabled={actionId === order.id}
            onClick={() => void submit({ gacha_action: 'forfeit' })}
          >
            {t('orderHold.gachaForfeit')}
          </button>
        </div>
      )}

      {reason === 'other' && (
        <p className="oh-hold-other-note">{t('orderHold.otherOnlyCancel')}</p>
      )}

      {error && <p className="oh-error">{error}</p>}

      <button
        type="button"
        className="oh-danger-btn oh-hold-cancel"
        disabled={actionId === order.id}
        onClick={() => onCancelOrder(order.id)}
      >
        {t('myOrders.cancelOrder')}
      </button>
    </section>
  );
}
