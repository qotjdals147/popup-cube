import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ShopperOrderView } from '@popup-cube/shared';
import { ShopperOrderCardLight } from './ShopperOrderCardLight';
import { t } from '../i18n';

interface ShopperOrderDetailSheetProps {
  order: ShopperOrderView;
  reviewKeys: Set<string>;
  actionId: string | null;
  claimFormId: string | null;
  claimDraft: Record<string, string>;
  onClose: () => void;
  onWriteReview: (order: ShopperOrderView, productId: string, productName: string) => void;
  onConfirmPurchase: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onSubmitClaim: (orderId: string) => void;
  onOpenClaimForm: (orderId: string) => void;
  onClaimDraftChange: (orderId: string, text: string) => void;
  onReload: () => Promise<void>;
  onActionStart: (orderId: string) => void;
  onActionEnd: () => void;
}

export function ShopperOrderDetailSheet({
  order,
  reviewKeys,
  actionId,
  claimFormId,
  claimDraft,
  onClose,
  onWriteReview,
  onConfirmPurchase,
  onCancelOrder,
  onSubmitClaim,
  onOpenClaimForm,
  onClaimDraftChange,
  onReload,
  onActionStart,
  onActionEnd,
}: ShopperOrderDetailSheetProps) {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    setTheme(document.querySelector('.shopper-account-page')?.getAttribute('data-theme') ?? null);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="shopper-account-page oh-detail-sheet-portal"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div
        className="oh-detail-sheet-backdrop"
        role="presentation"
        onClick={onClose}
        onWheel={(e) => e.stopPropagation()}
      >
        <div
          className="oh-detail-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="oh-detail-sheet-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="oh-detail-sheet-header">
            <h2 id="oh-detail-sheet-title" className="oh-detail-sheet-title">
              {t('myOrders.orderDetailTitle')}
            </h2>
            <button type="button" className="oh-detail-sheet-close" onClick={onClose} aria-label={t('common.close')}>
              ✕
            </button>
          </header>

          <div className="oh-detail-sheet-body shopper-account-main">
            <ShopperOrderCardLight
              order={order}
              reviewKeys={reviewKeys}
              actionId={actionId}
              claimFormId={claimFormId}
              claimDraft={claimDraft}
              onWriteReview={onWriteReview}
              onConfirmPurchase={onConfirmPurchase}
              onCancelOrder={onCancelOrder}
              onSubmitClaim={onSubmitClaim}
              onOpenClaimForm={onOpenClaimForm}
              onClaimDraftChange={onClaimDraftChange}
              onReload={onReload}
              onActionStart={onActionStart}
              onActionEnd={onActionEnd}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
