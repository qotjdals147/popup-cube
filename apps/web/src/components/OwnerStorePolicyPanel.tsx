import { useEffect, useState } from 'react';
import type { StorePolicy, StoreShippingFeeType } from '@popup-cube/shared';
import { getMyStore, updateStorePolicy } from '../lib/stores';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';
import {
  formatIntegerDisplay,
  formatIntegerInputRaw,
  parseIntegerInput,
} from '../lib/formatInteger';
import { AddressSearch } from './AddressSearch';

interface OwnerStorePolicyPanelProps {
  storeId: string;
}

function policyFromStore(store: StorePolicy): StorePolicy {
  return { ...store };
}

export function OwnerStorePolicyPanel({ storeId }: OwnerStorePolicyPanelProps) {
  const [draft, setDraft] = useState<StorePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getMyStore(storeId)
      .then((store) => {
        if (!active) return;
        if (!store) {
          setError(t('ownerPolicy.errorLoad'));
          return;
        }
        setDraft(policyFromStore(store));
      })
      .catch(() => {
        if (active) setError(t('ownerPolicy.errorLoad'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  function patch(partial: Partial<StorePolicy>) {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setSavedMsg(null);
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const updated = await updateStorePolicy(storeId, draft);
      setDraft(policyFromStore(updated));
      setSavedMsg(t('ownerPolicy.saved'));
    } catch {
      setError(t('ownerPolicy.errorSave'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section style={styles.panel}>
        <p style={styles.hint}>{t('ownerPolicy.loading')}</p>
      </section>
    );
  }

  if (!draft) {
    return (
      <section style={styles.panel}>
        <p style={styles.error}>{error ?? t('ownerPolicy.errorLoad')}</p>
      </section>
    );
  }

  return (
    <section style={styles.panel}>
      <p style={styles.intro}>{t('ownerPolicy.intro')}</p>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('ownerPolicy.csSection')}</h3>
        <label style={styles.label}>{t('ownerPolicy.csPhoneLabel')}</label>
        <input
          style={styles.input}
          value={draft.cs_phone ?? ''}
          onChange={(e) => patch({ cs_phone: e.target.value })}
          placeholder={t('ownerPolicy.csPhonePlaceholder')}
        />
        <label style={styles.label}>{t('ownerPolicy.csEmailLabel')}</label>
        <input
          style={styles.input}
          type="email"
          value={draft.cs_email ?? ''}
          onChange={(e) => patch({ cs_email: e.target.value })}
          placeholder={t('ownerPolicy.csEmailPlaceholder')}
        />
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('ownerPolicy.returnSection')}</h3>
        <label style={styles.label}>{t('ownerPolicy.returnNameLabel')}</label>
        <input
          style={styles.input}
          value={draft.return_recipient_name ?? ''}
          onChange={(e) => patch({ return_recipient_name: e.target.value })}
        />
        <label style={styles.label}>{t('ownerPolicy.returnPhoneLabel')}</label>
        <input
          style={styles.input}
          value={draft.return_phone ?? ''}
          onChange={(e) => patch({ return_phone: e.target.value })}
        />
        <div style={styles.addressSearchWrap}>
          <AddressSearch
            appearance="light"
            onSelect={(result) =>
              patch({
                return_postal_code: result.postal_code,
                return_address_line1: result.address_line1,
                return_address_line2: result.address_line2 ?? draft.return_address_line2 ?? '',
              })
            }
          />
        </div>
        <label style={styles.label}>{t('ownerPolicy.returnPostalLabel')}</label>
        <input
          style={styles.input}
          value={draft.return_postal_code ?? ''}
          onChange={(e) => patch({ return_postal_code: e.target.value })}
        />
        <label style={styles.label}>{t('ownerPolicy.returnAddressLabel')}</label>
        <input
          style={styles.input}
          value={draft.return_address_line1 ?? ''}
          onChange={(e) => patch({ return_address_line1: e.target.value })}
        />
        <input
          style={styles.input}
          value={draft.return_address_line2 ?? ''}
          onChange={(e) => patch({ return_address_line2: e.target.value })}
          placeholder={t('ownerPolicy.returnAddressLine2Placeholder')}
        />
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('ownerPolicy.guideSection')}</h3>
        <label style={styles.label}>{t('ownerPolicy.shippingGuideLabel')}</label>
        <textarea
          style={styles.textarea}
          rows={3}
          value={draft.shipping_guide ?? ''}
          onChange={(e) => patch({ shipping_guide: e.target.value })}
          placeholder={t('ownerPolicy.shippingGuidePlaceholder')}
        />
        <label style={styles.label}>{t('ownerPolicy.exchangeGuideLabel')}</label>
        <textarea
          style={styles.textarea}
          rows={3}
          value={draft.exchange_return_guide ?? ''}
          onChange={(e) => patch({ exchange_return_guide: e.target.value })}
          placeholder={t('ownerPolicy.exchangeGuidePlaceholder')}
        />
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('ownerPolicy.shippingFeeSection')}</h3>
        <div style={styles.feeTypeRow}>
          {(['free', 'flat', 'conditional_free'] as StoreShippingFeeType[]).map((type) => (
            <label key={type} style={styles.feeTypeOption}>
              <input
                type="radio"
                name="shippingFeeType"
                checked={draft.shipping_fee_type === type}
                onChange={() => patch({ shipping_fee_type: type })}
              />
              <span>{t(`ownerPolicy.shippingFeeType.${type}`)}</span>
            </label>
          ))}
        </div>

        {draft.shipping_fee_type !== 'free' && (
          <>
            <label style={styles.label}>{t('ownerPolicy.shippingFeeAmountLabel')}</label>
            <input
              style={styles.input}
              value={formatIntegerDisplay(draft.shipping_fee_amount)}
              onChange={(e) =>
                patch({ shipping_fee_amount: parseIntegerInput(formatIntegerInputRaw(e.target.value)) || 0 })
              }
              inputMode="numeric"
            />
          </>
        )}

        {draft.shipping_fee_type === 'conditional_free' && (
          <>
            <label style={styles.label}>{t('ownerPolicy.shippingFreeThresholdLabel')}</label>
            <input
              style={styles.input}
              value={formatIntegerDisplay(draft.shipping_free_threshold)}
              onChange={(e) =>
                patch({
                  shipping_free_threshold: parseIntegerInput(formatIntegerInputRaw(e.target.value)) || 0,
                })
              }
              inputMode="numeric"
            />
            <p style={styles.help}>{t('ownerPolicy.shippingFreeThresholdHelp')}</p>
          </>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {savedMsg && <p style={styles.success}>{savedMsg}</p>}

      <button type="button" style={styles.saveBtn} disabled={saving} onClick={() => void handleSave()}>
        {saving ? t('ownerPolicy.saving') : t('ownerPolicy.save')}
      </button>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: oc.surface,
    borderRadius: 12,
    padding: 24,
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadow,
  },
  intro: { color: oc.textSecondary, fontSize: fs.base, lineHeight: 1.55, margin: '0 0 20px' },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: `1px solid ${oc.border}`,
  },
  sectionTitle: { margin: '0 0 12px', fontSize: fs.lg, color: oc.text, fontWeight: 700 },
  label: { display: 'block', color: oc.textMuted, fontSize: fs.sm, margin: '10px 0 6px' },
  addressSearchWrap: { margin: '12px 0 4px' },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  feeTypeRow: { display: 'flex', flexDirection: 'column', gap: 8 },
  feeTypeOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: oc.text,
    fontSize: fs.base,
    cursor: 'pointer',
  },
  help: { color: oc.textMuted, fontSize: fs.sm, lineHeight: 1.45, margin: '8px 0 0' },
  saveBtn: {
    marginTop: 8,
    padding: '12px 20px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.base,
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: { color: oc.textMuted, fontSize: fs.base },
  error: { color: oc.danger, fontSize: fs.sm, margin: '8px 0 0' },
  success: { color: oc.successText, fontSize: fs.sm, margin: '8px 0 0' },
};
