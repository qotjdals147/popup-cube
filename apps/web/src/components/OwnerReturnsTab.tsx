import { useState } from 'react';
import { OwnerOrdersPanel } from './OwnerOrdersPanel';
import { OwnerReturnsPanel } from './OwnerReturnsPanel';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import type { OwnerNavigateTarget } from './OwnerOrderRelatedLinks';
import type { OwnerOrderFocus, OwnerReturnListFilter } from '../lib/ownerOrderFocus';
import { t } from '../i18n';

interface OwnerReturnsTabProps {
  storeId: string;
  refreshTick?: number;
  subTab?: ReturnsSubTab;
  onSubTabChange?: (tab: ReturnsSubTab) => void;
  returnsListFilter?: OwnerReturnListFilter;
  onReturnsListFilterChange?: (filter: OwnerReturnListFilter) => void;
  onNavigateRelated?: (target: OwnerNavigateTarget) => void;
  focusOrder?: OwnerOrderFocus | null;
  onFocusClear?: () => void;
  storeOpenDate?: string | null;
}

type ReturnsSubTab = 'claims' | 'requests';

/** AD-073 R2 — 반품·교환 탭: 문의(cl R1) + 구조화 신청(R2) */
export function OwnerReturnsTab({
  storeId,
  refreshTick = 0,
  subTab: controlledSubTab,
  onSubTabChange,
  returnsListFilter: controlledReturnsFilter,
  onReturnsListFilterChange,
  onNavigateRelated,
  focusOrder = null,
  onFocusClear,
  storeOpenDate = null,
}: OwnerReturnsTabProps) {
  const [internalSubTab, setInternalSubTab] = useState<ReturnsSubTab>('requests');
  const [internalReturnsFilter, setInternalReturnsFilter] = useState<OwnerReturnListFilter>('active');
  const subTab = controlledSubTab ?? internalSubTab;
  const returnsListFilter = controlledReturnsFilter ?? internalReturnsFilter;

  function setSubTab(next: ReturnsSubTab) {
    if (onSubTabChange) onSubTabChange(next);
    else setInternalSubTab(next);
  }

  function setReturnsListFilter(next: OwnerReturnListFilter) {
    if (onReturnsListFilterChange) onReturnsListFilterChange(next);
    else setInternalReturnsFilter(next);
  }

  return (
    <div>
      <div style={styles.subNav} role="tablist" aria-label={t('ownerReturns.subNavLabel')}>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'requests'}
          style={{ ...styles.subTab, ...(subTab === 'requests' ? styles.subTabActive : {}) }}
          onClick={() => setSubTab('requests')}
        >
          {t('ownerReturns.tabRequests')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'claims'}
          style={{ ...styles.subTab, ...(subTab === 'claims' ? styles.subTabActive : {}) }}
          onClick={() => setSubTab('claims')}
        >
          {t('ownerReturns.tabClaims')}
        </button>
      </div>
      <div style={styles.panel}>
        {subTab === 'requests' ? (
          <OwnerReturnsPanel
            storeId={storeId}
            refreshTick={refreshTick}
            listFilter={returnsListFilter}
            onListFilterChange={setReturnsListFilter}
            onNavigateRelated={onNavigateRelated}
            focusOrder={focusOrder}
            onFocusClear={onFocusClear}
            storeOpenDate={storeOpenDate}
          />
        ) : (
          <OwnerOrdersPanel
            storeId={storeId}
            embedded
            queue="claims"
            refreshTick={refreshTick}
            panelContext="returns-claims"
            onNavigateRelated={onNavigateRelated}
            focusOrder={focusOrder}
            onFocusClear={onFocusClear}
            storeOpenDate={storeOpenDate}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  subNav: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  subTab: {
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${oc.border}`,
    background: oc.surface,
    color: oc.textMuted,
    cursor: 'pointer',
    fontFamily: ownerFont,
    fontSize: fs.sm,
  },
  subTabActive: {
    borderColor: oc.primary,
    color: oc.navActiveText,
    background: oc.navActiveBg,
  },
  panel: { minHeight: 120 },
};
