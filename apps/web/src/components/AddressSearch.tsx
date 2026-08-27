import { useState } from 'react';
import { t } from '../i18n';
import type { DaumPostcodeResult } from '../lib/daumPostcode';
import { AddressPostcodeModal } from './AddressPostcodeModal';

interface AddressSearchProps {
  appearance?: 'light' | 'dark';
  disabled?: boolean;
  onSelect: (result: DaumPostcodeResult) => void;
}

/** 컴팩트 「주소 검색」 버튼 + embed 모달. */
export function AddressSearch({ appearance = 'dark', disabled, onSelect }: AddressSearchProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`address-search-btn address-search-btn--${appearance}`}
        onClick={() => setModalOpen(true)}
        disabled={disabled}
      >
        {t('mypage.addressSearchButton')}
      </button>
      <AddressPostcodeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={onSelect}
      />
    </>
  );
}
