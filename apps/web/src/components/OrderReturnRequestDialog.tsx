import { useEffect, useMemo, useState } from 'react';
import type { ReturnReasonCode, ShopperOrderView, StorePolicy } from '@popup-cube/shared';
import { DEFAULT_RETURN_REASON_OPTIONS } from '@popup-cube/shared';
import { getStoreSummary } from '../lib/stores';
import { requestReturn, type RequestReturnInput } from '../lib/orderReturns';
import { OrderError } from '../lib/orders';
import { t } from '../i18n';

interface OrderReturnRequestDialogProps {
  order: ShopperOrderView;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

function isChangeOfMindAllowed(order: ShopperOrderView, policy: StorePolicy): boolean {
  if (!policy.return_change_of_mind_allowed) return false;
  const anchor = order.purchase_confirmed_at ?? order.delivery_completed_at ?? order.shipped_at;
  if (!anchor) return true;
  const days = Math.max(0, policy.return_change_of_mind_days ?? 7);
  const deadline = new Date(anchor);
  deadline.setDate(deadline.getDate() + days);
  return new Date() <= deadline;
}

export function OrderReturnRequestDialog({
  order,
  open,
  onClose,
  onSubmitted,
}: OrderReturnRequestDialogProps) {
  const [policy, setPolicy] = useState<StorePolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<'return' | 'exchange'>('return');
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>('defective');
  const [reasonDetail, setReasonDetail] = useState('');
  const [exchangeMemo, setExchangeMemo] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    setError(null);
    setKind('return');
    setReasonCode('defective');
    setReasonDetail('');
    setExchangeMemo('');
    const initial: Record<string, number> = {};
    for (const item of order.items) {
      initial[item.id] = item.quantity;
    }
    setQuantities(initial);
    setLoading(true);
    void getStoreSummary(order.store_id)
      .then((store) => setPolicy(store))
      .catch(() => setPolicy(null))
      .finally(() => setLoading(false));
  }, [open, order]);

  const reasonOptions = useMemo(() => {
    if (!policy) return DEFAULT_RETURN_REASON_OPTIONS;
    const allowMind = isChangeOfMindAllowed(order, policy);
    return DEFAULT_RETURN_REASON_OPTIONS.filter(
      (opt) => opt.reasonCode !== 'change_of_mind' || allowMind,
    );
  }, [order, policy]);

  useEffect(() => {
    if (!reasonOptions.some((o) => o.reasonCode === reasonCode)) {
      setReasonCode(reasonOptions[0]?.reasonCode ?? 'defective');
    }
  }, [reasonOptions, reasonCode]);

  if (!open) return null;

  async function handleSubmit() {
    if (!policy) {
      setError(t('myOrders.returnPolicyLoadError'));
      return;
    }
    const selected = reasonOptions.find((o) => o.reasonCode === reasonCode);
    if (selected?.requiresMemo && !reasonDetail.trim()) {
      setError(t('orderReasons.memoRequired'));
      return;
    }
    const items = order.items
      .map((item) => ({
        order_item_id: item.id,
        quantity: Math.min(item.quantity, Math.max(0, quantities[item.id] ?? 0)),
      }))
      .filter((item) => item.quantity > 0);
    if (items.length === 0) {
      setError(t('myOrders.returnItemsRequired'));
      return;
    }
    const input: RequestReturnInput = {
      kind,
      reasonCode,
      reasonDetail: reasonDetail.trim() || null,
      items,
      exchangeMemo: kind === 'exchange' ? exchangeMemo.trim() || null : null,
    };
    setSubmitting(true);
    setError(null);
    try {
      await requestReturn(order.id, input);
      onSubmitted();
      onClose();
    } catch (err) {
      const code = err instanceof OrderError ? err.message : 'unknown';
      const key = `myOrders.returnErrors.${code}` as const;
      setError(t(key) || t('myOrders.returnSubmitError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="oh-return-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="oh-return-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oh-return-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="oh-return-dialog-header">
          <h2 id="oh-return-dialog-title">{t('myOrders.returnDialogTitle')}</h2>
          <button type="button" className="oh-return-dialog-close" onClick={onClose} aria-label={t('mypage.cancel')}>
            ×
          </button>
        </header>

        {loading ? (
          <p className="oh-return-dialog-hint">{t('myOrders.returnDialogLoading')}</p>
        ) : (
          <div className="oh-return-dialog-body">
            {policy && (
              <>
                <fieldset className="oh-return-fieldset">
                  <legend>{t('myOrders.returnKindLegend')}</legend>
                  <label className="oh-return-radio">
                    <input
                      type="radio"
                      name="return-kind"
                      checked={kind === 'return'}
                      onChange={() => setKind('return')}
                    />
                    {t('myOrders.returnKindReturn')}
                  </label>
                  {policy.exchange_allowed && (
                    <label className="oh-return-radio">
                      <input
                        type="radio"
                        name="return-kind"
                        checked={kind === 'exchange'}
                        onChange={() => setKind('exchange')}
                      />
                      {t('myOrders.returnKindExchange')}
                    </label>
                  )}
                </fieldset>

                <label className="oh-return-label">{t('myOrders.returnReasonLegend')}</label>
                <select
                  className="oh-return-select"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
                >
                  {reasonOptions.map((opt) => (
                    <option key={opt.reasonCode} value={opt.reasonCode}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </select>

                {reasonOptions.find((o) => o.reasonCode === reasonCode)?.requiresMemo && (
                  <textarea
                    className="oh-return-textarea"
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder={t('orderReasons.memoPlaceholder')}
                  />
                )}

                <div className="oh-return-label">{t('myOrders.returnItemsLegend')}</div>
                <ul className="oh-return-item-list">
                  {order.items.map((item) => (
                    <li key={item.id} className="oh-return-item-row">
                      <span>{item.product_name}</span>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={quantities[item.id] ?? item.quantity}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.min(item.quantity, Math.max(0, Number(e.target.value) || 0)),
                          }))
                        }
                        className="oh-return-qty"
                      />
                      <span className="oh-return-qty-max">/ {item.quantity}</span>
                    </li>
                  ))}
                </ul>

                {kind === 'exchange' && (
                  <>
                    <label className="oh-return-label">{t('myOrders.returnExchangeMemoLabel')}</label>
                    <textarea
                      className="oh-return-textarea"
                      value={exchangeMemo}
                      onChange={(e) => setExchangeMemo(e.target.value)}
                      placeholder={t('myOrders.returnExchangeMemoPlaceholder')}
                    />
                  </>
                )}

                {policy.return_address_line1 && (
                  <div className="oh-return-address-box">
                    <div className="oh-return-label">{t('myOrders.returnAddressLabel')}</div>
                    <p>
                      {policy.return_recipient_name}
                      {policy.return_phone ? ` · ${policy.return_phone}` : ''}
                    </p>
                    <p>
                      ({policy.return_postal_code}) {policy.return_address_line1}
                      {policy.return_address_line2 ? ` ${policy.return_address_line2}` : ''}
                    </p>
                    {policy.exchange_return_guide && (
                      <p className="oh-return-guide">{policy.exchange_return_guide}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {error && <p className="oh-return-error">{error}</p>}
          </div>
        )}

        <footer className="oh-return-dialog-footer">
          <button type="button" className="oh-btn-secondary" onClick={onClose} disabled={submitting}>
            {t('mypage.cancel')}
          </button>
          <button type="button" className="oh-btn-primary" onClick={() => void handleSubmit()} disabled={submitting || loading}>
            {submitting ? t('myOrders.returnSubmitting') : t('myOrders.returnSubmit')}
          </button>
        </footer>
      </div>
    </div>
  );
}
