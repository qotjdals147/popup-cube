import { useEffect, useState } from 'react';
import type { StoreReturnAddress } from '@popup-cube/shared';
import {
  createStoreReturnAddress,
  deleteStoreReturnAddress,
  listStoreReturnAddresses,
  setDefaultStoreReturnAddress,
  StoreReturnAddressError,
  updateStoreReturnAddress,
} from '../lib/storeReturnAddresses';
import {
  AddressFormFields,
  EMPTY_ADDRESS_FORM,
  isAddressFormValid,
  type AddressFormValues,
} from './AddressFormFields';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

/** AD-076 — 점주 반품·교환 수령지 CRUD (배송지 관리 패턴). */
export function OwnerReturnAddressPanel({ storeId }: { storeId: string }) {
  const [addresses, setAddresses] = useState<StoreReturnAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  function reload() {
    setLoading(true);
    setError(false);
    listStoreReturnAddresses(storeId)
      .then(setAddresses)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_ADDRESS_FORM);
    setSubmitError(null);
    setFormOpen(true);
  }

  function openEditForm(address: StoreReturnAddress) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      postal_code: address.postal_code,
      address_line1: address.address_line1,
      address_line2: address.address_line2 ?? '',
    });
    setSubmitError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!isAddressFormValid(form)) {
      setSubmitError(t('ownerReturnAddress.errorRequired'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingId) {
        await updateStoreReturnAddress(editingId, form);
      } else {
        await createStoreReturnAddress(storeId, { ...form, is_default: false }, addresses.length === 0);
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      setSubmitError(err instanceof StoreReturnAddressError ? err.message : t('ownerReturnAddress.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(addressId: string) {
    try {
      await deleteStoreReturnAddress(addressId);
      reload();
    } catch {
      setError(true);
    }
  }

  async function handleSetDefault(addressId: string) {
    try {
      await setDefaultStoreReturnAddress(storeId, addressId);
      reload();
    } catch {
      setError(true);
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <p style={styles.hint}>{t('ownerReturnAddress.intro')}</p>
        <button type="button" style={styles.addBtn} onClick={openCreateForm}>
          {t('ownerReturnAddress.addNew')}
        </button>
      </div>

      {loading && <p style={styles.muted}>{t('ownerReturnAddress.loading')}</p>}
      {!loading && error && <p style={styles.error}>{t('ownerReturnAddress.errorLoad')}</p>}
      {!loading && !error && addresses.length === 0 && (
        <p style={styles.muted}>{t('ownerReturnAddress.empty')}</p>
      )}

      {!loading && !error && addresses.length > 0 && (
        <div style={styles.list}>
          {addresses.map((address) => (
            <div key={address.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong style={styles.cardLabel}>{address.label}</strong>
                {address.is_default && <span style={styles.defaultBadge}>{t('ownerReturnAddress.defaultBadge')}</span>}
              </div>
              <div style={styles.cardLine}>
                {address.recipient_name} · {address.phone}
              </div>
              <div style={styles.cardLine}>
                ({address.postal_code}) {address.address_line1}
                {address.address_line2 ? ` ${address.address_line2}` : ''}
              </div>
              <div style={styles.cardActions}>
                {!address.is_default && (
                  <button type="button" style={styles.btn} onClick={() => void handleSetDefault(address.id)}>
                    {t('ownerReturnAddress.setDefault')}
                  </button>
                )}
                <button type="button" style={styles.btn} onClick={() => openEditForm(address)}>
                  {t('ownerReturnAddress.edit')}
                </button>
                <button type="button" style={styles.btnDanger} onClick={() => void handleDelete(address.id)}>
                  {t('ownerReturnAddress.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div style={styles.overlay} onClick={() => setFormOpen(false)}>
          <div style={styles.formPanel} onClick={(e) => e.stopPropagation()}>
            <h4 style={styles.formTitle}>
              {editingId ? t('ownerReturnAddress.editTitle') : t('ownerReturnAddress.createTitle')}
            </h4>
            <AddressFormFields values={form} onChange={setForm} appearance="light" />
            {submitError && <p style={styles.error}>{submitError}</p>}
            <div style={styles.formActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setFormOpen(false)}>
                {t('ownerReturnAddress.cancel')}
              </button>
              <button type="button" style={styles.saveBtn} onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? t('ownerReturnAddress.saving') : t('ownerReturnAddress.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { marginTop: 4 },
  header: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  hint: { margin: 0, flex: '1 1 200px', color: oc.textMuted, fontSize: fs.sm, lineHeight: 1.45 },
  addBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.primary}`,
    background: '#f0f6ff',
    color: oc.primary,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  muted: { color: oc.textMuted, fontSize: fs.sm, margin: '8px 0' },
  error: { color: oc.danger, fontSize: fs.sm, margin: '8px 0 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: oc.surfaceMuted,
    borderRadius: 10,
    padding: 14,
    border: `1px solid ${oc.border}`,
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardLabel: { fontSize: fs.base, color: oc.text },
  defaultBadge: {
    fontSize: 11,
    color: oc.primary,
    border: `1px solid ${oc.primary}`,
    borderRadius: 999,
    padding: '2px 8px',
  },
  cardLine: { fontSize: fs.sm, color: oc.textSecondary, marginBottom: 4 },
  cardActions: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  btn: {
    padding: '5px 10px',
    borderRadius: 6,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: 12,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid #f5c2c7',
    background: '#fff5f6',
    color: oc.danger,
    fontSize: 12,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 80,
    padding: 16,
  },
  formPanel: {
    background: oc.surface,
    borderRadius: 14,
    width: '100%',
    maxWidth: 440,
    padding: 20,
    boxShadow: oc.shadow,
    border: `1px solid ${oc.border}`,
  },
  formTitle: { margin: '0 0 12px', fontSize: fs.lg, color: oc.text, fontWeight: 700 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  cancelBtn: {
    padding: '9px 16px',
    borderRadius: 8,
    border: `1px solid ${oc.border}`,
    background: oc.surface,
    color: oc.textMuted,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '9px 18px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
