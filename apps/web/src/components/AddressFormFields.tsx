import { t } from '../i18n';

export interface AddressFormValues {
  label: string;
  recipient_name: string;
  phone: string;
  postal_code: string;
  address_line1: string;
  address_line2: string;
}

export const EMPTY_ADDRESS_FORM: AddressFormValues = {
  label: '',
  recipient_name: '',
  phone: '',
  postal_code: '',
  address_line1: '',
  address_line2: '',
};

export function isAddressFormValid(values: AddressFormValues): boolean {
  return (
    values.label.trim().length > 0 &&
    values.recipient_name.trim().length > 0 &&
    values.phone.trim().length > 0 &&
    values.postal_code.trim().length > 0 &&
    values.address_line1.trim().length > 0
  );
}

interface AddressFormFieldsProps {
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
}

/**
 * 배송지 입력 폼 (마이페이지 주소 관리 · 결제 시 신규 주소 추가에서 공통으로 사용, AD-030).
 */
export function AddressFormFields({ values, onChange }: AddressFormFieldsProps) {
  function set<K extends keyof AddressFormValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div style={styles.grid}>
      <input
        style={styles.input}
        value={values.label}
        onChange={(e) => set('label', e.target.value)}
        placeholder={t('mypage.labelPlaceholder')}
        maxLength={40}
      />
      <input
        style={styles.input}
        value={values.recipient_name}
        onChange={(e) => set('recipient_name', e.target.value)}
        placeholder={t('mypage.recipientPlaceholder')}
        maxLength={60}
      />
      <input
        style={styles.input}
        value={values.phone}
        onChange={(e) => set('phone', e.target.value)}
        placeholder={t('mypage.phonePlaceholder')}
        maxLength={20}
      />
      <input
        style={styles.input}
        value={values.postal_code}
        onChange={(e) => set('postal_code', e.target.value)}
        placeholder={t('mypage.postalCodePlaceholder')}
        maxLength={10}
      />
      <input
        style={{ ...styles.input, gridColumn: '1 / -1' }}
        value={values.address_line1}
        onChange={(e) => set('address_line1', e.target.value)}
        placeholder={t('mypage.addressLine1Placeholder')}
        maxLength={200}
      />
      <input
        style={{ ...styles.input, gridColumn: '1 / -1' }}
        value={values.address_line2}
        onChange={(e) => set('address_line2', e.target.value)}
        placeholder={t('mypage.addressLine2Placeholder')}
        maxLength={200}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#0f3460',
    color: '#fff',
    fontSize: 13,
  },
};
