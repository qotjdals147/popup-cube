import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReturnReasonCode, ShopperOrderView, StorePolicy } from '@popup-cube/shared';
import { DEFAULT_RETURN_REASON_OPTIONS } from '@popup-cube/shared';
import { getStoreSummary } from '../lib/stores';
import { requestReturn, type RequestReturnInput } from '../lib/orderReturns';
import { OrderError } from '../lib/orders';
import { copyTextToClipboard, formatReturnAddressText } from '../lib/returnAddressText';
import { QuantityStepper } from './QuantityStepper';
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
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCopyState('idle');
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

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [open]);

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

  const requiresMemo = reasonOptions.find((o) => o.reasonCode === reasonCode)?.requiresMemo;

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

  async function handleCopyAddress() {
    if (!policy?.return_address_line1) return;
    const ok = await copyTextToClipboard(formatReturnAddressText(policy));
    setCopyState(ok ? 'ok' : 'fail');
    if (ok) {
      window.setTimeout(() => setCopyState('idle'), 2000);
    }
  }

  return createPortal(
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
                <div className="oh-return-section">
                  <div className="oh-return-label">{t('myOrders.returnKindLegend')}</div>
                  <div className="oh-return-kind-row" role="radiogroup" aria-label={t('myOrders.returnKindLegend')}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={kind === 'return'}
                      className={`oh-return-kind-btn${kind === 'return' ? ' oh-return-kind-btn--active' : ''}`}
                      onClick={() => setKind('return')}
                    >
                      {t('myOrders.returnKindReturn')}
                    </button>
                    {policy.exchange_allowed && (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={kind === 'exchange'}
                        className={`oh-return-kind-btn${kind === 'exchange' ? ' oh-return-kind-btn--active' : ''}`}
                        onClick={() => setKind('exchange')}
                      >
                        {t('myOrders.returnKindExchange')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="oh-return-section oh-return-inline-row">
                  <label className="oh-return-label" htmlFor="oh-return-reason">
                    {t('myOrders.returnReasonLegend')}
                  </label>
                  <select
                    id="oh-return-reason"
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
                </div>

                {requiresMemo && (
                  <textarea
                    className="oh-return-textarea oh-return-textarea--compact"
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder={t('orderReasons.memoPlaceholder')}
                    rows={2}
                  />
                )}

                <div className="oh-return-section">
                  <div className="oh-return-label">{t('myOrders.returnItemsLegend')}</div>
                  <ul className="oh-return-item-list">
                    {order.items.map((item) => (
                      <li key={item.id} className="oh-return-item-row">
                        <span className="oh-return-item-name">{item.product_name}</span>
                        <QuantityStepper
                          className="oh-return-qty-stepper"
                          compact
                          value={quantities[item.id] ?? item.quantity}
                          min={0}
                          max={item.quantity}
                          maxLabel={item.quantity}
                          onChange={(next) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: next,
                            }))
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                {kind === 'exchange' && (
                  <textarea
                    className="oh-return-textarea oh-return-textarea--compact"
                    value={exchangeMemo}
                    onChange={(e) => setExchangeMemo(e.target.value)}
                    placeholder={t('myOrders.returnExchangeMemoPlaceholder')}
                    rows={2}
                    aria-label={t('myOrders.returnExchangeMemoLabel')}
                  />
                )}

                {policy.return_address_line1 && (
                  <div className="oh-return-address-box">
                    <div className="oh-return-address-head">
                      <div className="oh-return-label">{t('myOrders.returnAddressLabel')}</div>
                      <button type="button" className="oh-return-copy-btn" onClick={() => void handleCopyAddress()}>
                        {copyState === 'ok'
                          ? t('myOrders.returnAddressCopied')
                          : copyState === 'fail'
                            ? t('myOrders.returnAddressCopyFailed')
                            : t('myOrders.returnAddressCopy')}
                      </button>
                    </div>
                    <p className="oh-return-address-line">
                      {policy.return_recipient_name}
                      {policy.return_phone ? ` · ${policy.return_phone}` : ''}
                    </p>
                    <p className="oh-return-address-line">
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
    </div>,
    document.body,
  );
}
