import { t } from '../i18n';
import type { DaumPostcodeResult } from '../lib/daumPostcode';
import { AddressSearch } from './AddressSearch';

export interface AddressFieldValues {
  postal_code: string;
  address_line1: string;
  address_line2: string;
}

interface AddressInputBlockProps {
  values: AddressFieldValues;
  onChange: (patch: Partial<AddressFieldValues>) => void;
  appearance?: 'light' | 'dark';
  line2Placeholder?: string;
  showSectionLabel?: boolean;
}

/** 우편번호+검색 · 기본주소 · 상세주소 — 손님·점주 공통 (AD-076). */
export function AddressInputBlock({
  values,
  onChange,
  appearance = 'light',
  line2Placeholder,
  showSectionLabel = true,
}: AddressInputBlockProps) {
  function applySearchResult(result: DaumPostcodeResult) {
    onChange({
      postal_code: result.postal_code,
      address_line1: result.address_line1,
      address_line2: result.address_line2 ?? values.address_line2,
    });
  }

  return (
    <div className={`address-input-block address-input-block--${appearance}`}>
      {showSectionLabel && (
        <p className="address-input-block__section-label">{t('mypage.addressSectionLabel')}</p>
      )}
      <div className="address-input-block__postal-row">
        <input
          className="address-input-block__input address-input-block__postal"
          value={values.postal_code}
          readOnly
          placeholder={t('mypage.postalCodePlaceholder')}
          maxLength={10}
          aria-label={t('mypage.postalCodePlaceholder')}
        />
        <AddressSearch appearance={appearance} onSelect={applySearchResult} />
      </div>
      <input
        className="address-input-block__input address-input-block__line1"
        value={values.address_line1}
        onChange={(e) => onChange({ address_line1: e.target.value })}
        placeholder={t('mypage.addressLine1Placeholder')}
        maxLength={200}
      />
      <input
        className="address-input-block__input address-input-block__line2"
        value={values.address_line2}
        onChange={(e) => onChange({ address_line2: e.target.value })}
        placeholder={line2Placeholder ?? t('mypage.addressLine2Placeholder')}
        maxLength={200}
      />
    </div>
  );
}
