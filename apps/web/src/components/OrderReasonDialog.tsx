import { useEffect, useMemo, useState } from 'react';
import type { HoldReasonCode, OrderReasonKind, RejectReasonCode } from '@popup-cube/shared';
import {
  DEFAULT_HOLD_REASON_OPTIONS,
  DEFAULT_REJECT_REASON_OPTIONS,
  type OrderReasonTemplateOption,
} from '@popup-cube/shared';
import { deleteStoreReasonTemplate, listStoreReasonTemplates } from '../lib/orders';
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

/** AD-069 — 점주 보류/거절 사유 선택 (코드 → 손님 UI + optional 메모) */
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
  const [legacyTemplates, setLegacyTemplates] = useState<
    Array<{ id: string; reason_code: string; label: string }>
  >([]);
  const [reasonCode, setReasonCode] = useState<string>(defaults[0]?.reasonCode ?? 'other');
  const [memo, setMemo] = useState('');
  const [affectedIds, setAffectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void listStoreReasonTemplates(storeId, kind)
      .then((rows) => setLegacyTemplates(rows))
      .catch(() => setLegacyTemplates([]));
  }, [storeId, kind]);

  const selectedDefault = defaults.find((o) => o.reasonCode === reasonCode);
  const needsItems = kind === 'hold' && selectedDefault?.requiresAffectedItems;
  const needsMemo = selectedDefault?.requiresMemo;

  const options = useMemo(
    () =>
      defaults.map((o: OrderReasonTemplateOption) => ({
        value: o.reasonCode,
        label: t(o.labelKey),
      })),
    [defaults],
  );

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

  async function handleDeleteLegacyTemplate(templateId: string) {
    setDeletingId(templateId);
    try {
      await deleteStoreReasonTemplate(templateId);
      setLegacyTemplates((prev) => prev.filter((row) => row.id !== templateId));
    } catch {
      window.alert(t('orderReasons.templateDeleteError'));
    } finally {
      setDeletingId(null);
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
            <option key={o.value} value={o.value}>
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

        {legacyTemplates.length > 0 && (
          <div style={styles.legacyBox}>
            <div style={styles.legacyHint}>{t('orderReasons.legacyTemplateHint')}</div>
            {legacyTemplates.map((row) => (
              <div key={row.id} style={styles.legacyRow}>
                <span style={styles.legacyLabel}>{row.label}</span>
                <button
                  type="button"
                  style={styles.deleteBtn}
                  disabled={deletingId === row.id}
                  onClick={() => void handleDeleteLegacyTemplate(row.id)}
                >
                  {t('orderReasons.deleteTemplate')}
                </button>
              </div>
            ))}
          </div>
        )}

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

const fieldBase: React.CSSProperties = {
  boxSizing: 'border-box',
  maxWidth: '100%',
};

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
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  title: { margin: '0 0 14px', fontSize: fs.lg, color: oc.text, fontWeight: 600 },
  label: { display: 'block', fontSize: fs.sm, color: oc.textMuted, marginBottom: 6, fontWeight: 600 },
  select: {
    ...fieldBase,
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
    boxSizing: 'border-box',
  },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: fs.sm, marginBottom: 6, color: oc.text },
  textarea: {
    ...fieldBase,
    width: '100%',
    minHeight: 72,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    fontSize: fs.sm,
    resize: 'vertical',
    fontFamily: ownerFont,
    marginBottom: 10,
    display: 'block',
  },
  legacyBox: {
    marginBottom: 14,
    padding: 10,
    borderRadius: 8,
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    boxSizing: 'border-box',
  },
  legacyHint: { fontSize: fs.xs, color: oc.textMuted, marginBottom: 8, lineHeight: 1.45 },
  legacyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  legacyLabel: { fontSize: fs.sm, color: oc.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
  deleteBtn: {
    flexShrink: 0,
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.danger ?? '#b42318',
    fontSize: fs.xs,
    cursor: 'pointer',
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
