import { t } from '../i18n';

interface ShopperConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** WebView-safe 확인 — `window.confirm` URL 노출 없음 (쿠팡·배민형) */
export function ShopperConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ShopperConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="oh-return-dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="oh-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="oh-confirm-dialog-title"
        aria-describedby="oh-confirm-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="oh-return-dialog-header">
          <h2 id="oh-confirm-dialog-title">{title ?? t('notifications.confirmTitle')}</h2>
        </header>
        <p id="oh-confirm-dialog-message" className="oh-confirm-dialog-message">
          {message}
        </p>
        <footer className="oh-return-dialog-footer">
          <button type="button" className="oh-btn-secondary" disabled={busy} onClick={onCancel}>
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            className={danger ? 'oh-btn-danger' : 'oh-btn-primary'}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.confirm')}
          </button>
        </footer>
      </div>
    </div>
  );
}
