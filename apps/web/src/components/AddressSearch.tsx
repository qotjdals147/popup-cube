import { useState } from 'react';
import { t } from '../i18n';
import { openDaumPostcodeSearch, type DaumPostcodeResult } from '../lib/daumPostcode';

interface AddressSearchProps {
  appearance?: 'light' | 'dark';
  disabled?: boolean;
  onSelect: (result: DaumPostcodeResult) => void;
}

/**
 * 다음(카카오) 우편번호 검색 — 배송지·반품지 공통 (AD-076).
 */
export function AddressSearch({ appearance = 'dark', disabled, onSelect }: AddressSearchProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError(false);
    try {
      const result = await openDaumPostcodeSearch();
      if (result) onSelect(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const buttonStyle = appearance === 'light' ? styles.buttonLight : styles.buttonDark;

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        className="address-search-btn"
        style={{ ...buttonStyle, ...(loading ? styles.buttonBusy : undefined) }}
        onClick={() => void handleSearch()}
        disabled={disabled || loading}
      >
        {loading ? t('mypage.addressSearchLoading') : t('mypage.addressSearchButton')}
      </button>
      {error && <p style={styles.error}>{t('mypage.addressSearchError')}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    gridColumn: '1 / -1',
  },
  buttonDark: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #4062a0',
    background: '#13284d',
    color: '#d8e6ff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonLight: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1.5px solid #3182f6',
    background: '#f0f6ff',
    color: '#3182f6',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonBusy: {
    opacity: 0.7,
    cursor: 'wait',
  },
  error: {
    margin: '6px 0 0',
    fontSize: 12,
    color: '#f04452',
  },
};
