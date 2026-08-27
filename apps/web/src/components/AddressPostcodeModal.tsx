import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { embedDaumPostcode, type DaumPostcodeResult } from '../lib/daumPostcode';
import { t } from '../i18n';

interface AddressPostcodeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (result: DaumPostcodeResult) => void;
}

/** 다음 우편번호 embed 전체화면 레이어 (Expo WebView popup 차단 대응). */
export function AddressPostcodeModal({ open, onClose, onSelect }: AddressPostcodeModalProps) {
  const embedRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const onSelectRef = useRef(onSelect);
  const [loadError, setLoadError] = useState(false);

  onCloseRef.current = onClose;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!open || !embedRef.current) return;

    let active = true;
    setLoadError(false);
    const container = embedRef.current;

    void embedDaumPostcode(container, {
      onComplete: (result) => {
        if (!active) return;
        onSelectRef.current(result);
        onCloseRef.current();
      },
      onForceClose: () => {
        if (!active) return;
        onCloseRef.current();
      },
    }).catch(() => {
      if (active) setLoadError(true);
    });

    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="address-postcode-modal" role="dialog" aria-modal="true" aria-label={t('mypage.addressSearchTitle')}>
      <header className="address-postcode-modal__header">
        <button type="button" className="address-postcode-modal__close" onClick={onClose} aria-label={t('mypage.addressSearchClose')}>
          ←
        </button>
        <span className="address-postcode-modal__title">{t('mypage.addressSearchTitle')}</span>
      </header>
      {loadError ? (
        <p className="address-postcode-modal__error">{t('mypage.addressSearchError')}</p>
      ) : (
        <div ref={embedRef} className="address-postcode-modal__embed" />
      )}
    </div>,
    document.body,
  );
}
