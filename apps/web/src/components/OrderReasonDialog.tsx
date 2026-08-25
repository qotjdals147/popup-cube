import { useEffect, useMemo, useState } from 'react';
import type { HoldReasonCode, OrderReasonKind, RejectReasonCode } from '@popup-cube/shared';
import {
  DEFAULT_HOLD_REASON_OPTIONS,
  DEFAULT_REJECT_REASON_OPTIONS,
  type OrderReasonTemplateOption,
} from '@popup-cube/shared';
import { listStoreReasonTemplates, upsertStoreReasonTemplate } from '../lib/orders';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

interface OrderLineOption {
  id: string;
  product_name: string;
  quantity: number;
}

export interface OrderReasonDialogResult {
  reasonCode: HoldReasonCode | RejectReasonCode;
  memo: string;
  affectedItemIds?: string[];
}

interface OrderReasonDialogProps {
  kind: OrderReasonKind;
  storeId: string;
  orderItems?: OrderLineOption[];
  title: string;
  confirmLabel: string;
  onConfirm: (result: OrderReasonDialogResult) => void;
  onCancel: () => void;
}

/** AD-069 — 점주 보류/거절 사유 선택 (템플릿 + 메모 + 재고 부족 시 품목 선택) */
export function OrderReasonDialog({
  kind,
  storeId,
  orderItems = [],
  title,
  confirmLabel,
  onConfirm,
  onCancel,
}: OrderReasonDialogProps) {
  const defaults = kind === 'hold' ? DEFAULT_HOLD_REASON_OPTIONS : DEFAULT_REJECT_REASON_OPTIONS;
  const [customTemplates, setCustomTemplates] = useState<OrderReasonTemplateOption[]>([]);
  const [reasonCode, setReasonCode] = useState<string>(defaults[0]?.reasonCode ?? 'other');
  const [memo, setMemo] = useState('');
  const [affectedIds, setAffectedIds] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    void listStoreReasonTemplates(storeId, kind)
      .then((rows) =>
        setCustomTemplates(
          rows.map((r) => ({
            reasonCode: r.reason_code as HoldReasonCode | RejectReasonCode,
            labelKey: r.label,
          })),
        ),
      )
      .catch(() => setCustomTemplates([]));
  }, [storeId, kind]);

  const selectedDefault = defaults.find((o) => o.reasonCode === reasonCode);
  const needsItems = kind === 'hold' && selectedDefault?.requiresAffectedItems;
  const needsMemo = selectedDefault?.requiresMemo;

  const options = useMemo(() => {
    const merged: Array<{ value: string; label: string }> = defaults.map((o) => ({
      value: o.reasonCode,
      label: t(o.labelKey),
    }));
    for (const c of customTemplates) {
      if (typeof c.labelKey === 'string' && !c.labelKey.startsWith('orderReasons.')) {
        merged.push({ value: c.reasonCode, label: c.labelKey });
      }
    }
    return merged;
  }, [defaults, customTemplates]);

  function toggleAffected(id: string) {
    setAffectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit() {
    if (needsMemo && !memo.trim()) {
      window.alert(t('orderReasons.memoRequired'));
      return;
    }
    if (needsItems && affectedIds.length === 0) {
      window.alert(t('orderReasons.itemsRequired'));
      return;
    }
    onConfirm({
      reasonCode: reasonCode as HoldReasonCode | RejectReasonCode,
      memo: memo.trim(),
      affectedItemIds: needsItems ? affectedIds : undefined,
    });
  }

  async function handleSaveTemplate() {
    const label = customLabel.trim();
    if (!label) return;
    setSavingTemplate(true);
    try {
      await upsertStoreReasonTemplate(storeId, kind, reasonCode, label);
      setCustomTemplates((prev) => [...prev, { reasonCode: reasonCode as HoldReasonCode, labelKey: label }]);
      setCustomLabel('');
    } catch {
      window.alert(t('orderReasons.templateSaveError'));
    } finally {
      setSavingTemplate(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 style={styles.title}>{title}</h3>
        <label style={styles.label}>{t('orderReasons.selectReason')}</label>
        <select
          style={styles.select}
          value={reasonCode}
          onChange={(e) => {
            setReasonCode(e.target.value);
            setAffectedIds([]);
          }}
        >
          {options.map((o) => (
            <option key={`${o.value}-${o.label}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {needsItems && (
          <div style={styles.itemsBox}>
            <div style={styles.label}>{t('orderReasons.selectAffectedItems')}</div>
            {orderItems.map((item) => (
              <label key={item.id} style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={affectedIds.includes(item.id)}
                  onChange={() => toggleAffected(item.id)}
                />
                <span>
                  {item.product_name} × {item.quantity}
                </span>
              </label>
            ))}
          </div>
        )}

        <label style={styles.label}>{t('orderReasons.memoOptional')}</label>
        <textarea
          style={styles.textarea}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={t('orderReasons.memoPlaceholder')}
        />

        <div style={styles.templateRow}>
          <input
            style={styles.templateInput}
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder={t('orderReasons.addTemplatePlaceholder')}
          />
          <button type="button" style={styles.secondaryBtn} disabled={savingTemplate} onClick={() => void handleSaveTemplate()}>
            {t('orderReasons.saveTemplate')}
          </button>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.secondaryBtn} onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="button" style={styles.primaryBtn} onClick={handleSubmit}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: oc.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 80,
    padding: 16,
  },
  panel: {
    background: oc.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 440,
    padding: 20,
    boxShadow: oc.shadowMd,
    border: `1px solid ${oc.border}`,
    fontFamily: ownerFont,
  },
  title: { margin: '0 0 14px', fontSize: fs.lg, color: oc.text, fontWeight: 600 },
  label: { display: 'block', fontSize: fs.sm, color: oc.textMuted, marginBottom: 6, fontWeight: 600 },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    marginBottom: 12,
    fontSize: fs.sm,
    background: oc.surface,
  },
  itemsBox: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
  },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: fs.sm, marginBottom: 6, color: oc.text },
  textarea: {
    width: '100%',
    minHeight: 72,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
    resize: 'vertical',
    fontFamily: ownerFont,
    marginBottom: 10,
  },
  templateRow: { display: 'flex', gap: 8, marginBottom: 16 },
  templateInput: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
};
