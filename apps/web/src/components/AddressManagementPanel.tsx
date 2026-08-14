import { useEffect, useState } from 'react';
import type { UserAddress } from '@popup-cube/shared';
import { useAuth } from '../context/AuthContext';
import {
  AddressError,
  createAddress,
  deleteAddress,
  listMyAddresses,
  setDefaultAddress,
  updateAddress,
} from '../lib/addresses';
import {
  AddressFormFields,
  EMPTY_ADDRESS_FORM,
  isAddressFormValid,
  type AddressFormValues,
} from './AddressFormFields';
import { t } from '../i18n';

/** AD-030 — 배송지 CRUD (마이페이지·앱 「내 정보」 공용) */
export function AddressManagementPanel({ appearance = 'dark' }: { appearance?: 'light' | 'dark' }) {
  const isLight = appearance === 'light';
  const { userId } = useAuth();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function reload() {
    setLoading(true);
    setError(false);
    listMyAddresses()
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

  function openEditForm(address: UserAddress) {
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
    if (!userId) return;
    if (!isAddressFormValid(form)) {
      setSubmitError(t('mypage.errorRequired'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await createAddress(userId, { ...form, is_default: false }, false);
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      setSubmitError(err instanceof AddressError ? err.message : t('mypage.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(addressId: string) {
    try {
      await deleteAddress(addressId);
      reload();
    } catch {
      setError(true);
    }
  }

  async function handleSetDefault(addressId: string) {
    if (!userId) return;
    try {
      await setDefaultAddress(userId, addressId);
      reload();
    } catch {
      setError(true);
    }
  }

  return (
    <div className={isLight ? 'addr-root' : undefined}>
      <div className={isLight ? 'addr-section-header' : undefined} style={isLight ? undefined : styles.sectionHeader}>
        <h2 className={isLight ? 'addr-section-title' : undefined} style={isLight ? undefined : styles.sectionTitle}>
          {t('mypage.addressTabTitle')}
        </h2>
        <button
          type="button"
          className={isLight ? 'addr-add-btn' : undefined}
          style={isLight ? undefined : styles.addButton}
          onClick={openCreateForm}
        >
          {t('mypage.addNew')}
        </button>
      </div>

      {loading && (
        <p className={isLight ? 'addr-hint' : undefined} style={isLight ? undefined : styles.hint}>
          {t('mypage.loading')}
        </p>
      )}
      {!loading && error && (
        <p className={isLight ? 'addr-error' : undefined} style={isLight ? undefined : styles.error}>
          {t('mypage.errorLoad')}
        </p>
      )}
      {!loading && !error && addresses.length === 0 && (
        <p className={isLight ? 'addr-hint' : undefined} style={isLight ? undefined : styles.hint}>
          {t('mypage.empty')}
        </p>
      )}

      {!loading && !error && addresses.length > 0 && (
        <div className={isLight ? 'addr-list' : undefined} style={isLight ? undefined : styles.list}>
          {addresses.map((address) => (
            <div key={address.id} className={isLight ? 'addr-card' : undefined} style={isLight ? undefined : styles.card}>
              <div className={isLight ? 'addr-card-header' : undefined} style={isLight ? undefined : styles.cardHeader}>
                <strong className={isLight ? 'addr-card-label' : undefined} style={isLight ? undefined : styles.cardLabel}>
                  {address.label}
                </strong>
                {address.is_default && (
                  <span className={isLight ? 'addr-default-badge' : undefined} style={isLight ? undefined : styles.defaultBadge}>
                    {t('mypage.defaultBadge')}
                  </span>
                )}
              </div>
              <div className={isLight ? 'addr-card-line' : undefined} style={isLight ? undefined : styles.cardLine}>
                {address.recipient_name} · {address.phone}
              </div>
              <div className={isLight ? 'addr-card-line' : undefined} style={isLight ? undefined : styles.cardLine}>
                ({address.postal_code}) {address.address_line1}
                {address.address_line2 ? ` ${address.address_line2}` : ''}
              </div>
              <div className={isLight ? 'addr-card-actions' : undefined} style={isLight ? undefined : styles.cardActions}>
                {!address.is_default && (
                  <button
                    type="button"
                    className={isLight ? 'addr-btn' : undefined}
                    style={isLight ? undefined : styles.smallButton}
                    onClick={() => void handleSetDefault(address.id)}
                  >
                    {t('mypage.setDefault')}
                  </button>
                )}
                <button
                  type="button"
                  className={isLight ? 'addr-btn' : undefined}
                  style={isLight ? undefined : styles.smallButton}
                  onClick={() => openEditForm(address)}
                >
                  {t('mypage.edit')}
                </button>
                <button
                  type="button"
                  className={isLight ? 'addr-btn addr-btn-danger' : undefined}
                  style={isLight ? undefined : styles.smallButtonDanger}
                  onClick={() => void handleDelete(address.id)}
                >
                  {t('mypage.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className={isLight ? 'addr-form-overlay' : undefined}
          style={isLight ? undefined : styles.overlay}
          onClick={() => setFormOpen(false)}
        >
          <div
            className={isLight ? 'addr-form-panel' : undefined}
            style={isLight ? undefined : styles.formPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <AddressFormFields values={form} onChange={setForm} appearance={isLight ? 'light' : 'dark'} />
            {submitError && (
              <p className={isLight ? 'addr-error' : undefined} style={isLight ? undefined : styles.error}>
                {submitError}
              </p>
            )}
            <div className={isLight ? 'addr-form-actions' : undefined} style={isLight ? undefined : styles.formActions}>
              <button
                type="button"
                className={isLight ? 'addr-cancel-btn' : undefined}
                style={isLight ? undefined : styles.cancelButton}
                onClick={() => setFormOpen(false)}
              >
                {t('mypage.cancel')}
              </button>
              <button
                type="button"
                className={isLight ? 'addr-save-btn' : undefined}
                style={isLight ? undefined : styles.saveButton}
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting ? t('mypage.saving') : t('mypage.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, margin: 0, color: '#fff' },
  addButton: {
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: { color: '#a0a0c0', fontSize: 13, textAlign: 'center', padding: '30px 0' },
  error: { color: '#ff6b6b', fontSize: 12, margin: '6px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#0f3460',
    borderRadius: 10,
    padding: 14,
    border: '1px solid #2c4270',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  cardLabel: { fontSize: 14, color: '#fff' },
  defaultBadge: {
    fontSize: 11,
    color: '#d8e4ff',
    border: '1px solid #4062a0',
    borderRadius: 999,
    padding: '2px 8px',
  },
  cardLine: { fontSize: 12, color: '#a0a0c0', marginBottom: 4 },
  cardActions: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  smallButton: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid #2c4270',
    background: '#16213e',
    color: '#fff',
    fontSize: 11,
    cursor: 'pointer',
  },
  smallButtonDanger: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid #5a2b3a',
    background: '#2f1620',
    color: '#ff8686',
    fontSize: 11,
    cursor: 'pointer',
  },
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
  formPanel: {
    background: '#16213e',
    borderRadius: 14,
    width: '100%',
    maxWidth: 440,
    padding: 20,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  cancelButton: {
    padding: '9px 16px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#a0a0c0',
    fontSize: 13,
    cursor: 'pointer',
  },
  saveButton: {
    padding: '9px 18px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
