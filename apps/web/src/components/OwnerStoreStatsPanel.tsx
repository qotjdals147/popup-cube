import { useEffect, useState } from 'react';
import { getStoreKpi, type StoreKpi } from '../lib/storeKpi';
import { OwnerStoreKpiStrip } from './OwnerStoreKpiStrip';
import { OwnerProductSalesPanel } from './OwnerProductSalesPanel';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerStoreStatsPanelProps {
  storeId: string;
}

/** 점주 「통계」 탭 — 매출·주문 KPI + 차트 (AD-084 UX) */
export function OwnerStoreStatsPanel({ storeId }: OwnerStoreStatsPanelProps) {
  const [kpi, setKpi] = useState<StoreKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const data = await getStoreKpi(storeId);
        if (!cancelled) setKpi(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return (
    <section style={styles.page}>
      <p style={styles.lead}>{t('ownerStats.lead')}</p>
      {error && <p style={styles.error}>{t('ownerStats.loadError')}</p>}
      <OwnerStoreKpiStrip kpi={kpi} loading={loading} variant="page" />
      <OwnerProductSalesPanel storeId={storeId} variant="page" />
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: oc.surface,
    borderRadius: 12,
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadow,
    padding: '20px 22px',
  },
  lead: {
    margin: '0 0 16px',
    fontSize: fs.base,
    color: oc.textSecondary,
    lineHeight: 1.6,
  },
  error: { margin: '0 0 12px', color: oc.dangerText, fontSize: fs.sm },
};
