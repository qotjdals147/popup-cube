import type { StoreKpi } from '../lib/storeKpi';
import { formatWon } from '../lib/storeKpi';
import { formatIntegerDisplay } from '../lib/formatInteger';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerStoreKpiStripProps {
  kpi: StoreKpi | null;
  loading?: boolean;
  /** card = /home 매장 카드 · page = 매장 관리 「통계」 탭 */
  variant?: 'card' | 'page';
}

export function OwnerStoreKpiStrip({ kpi, loading, variant = 'card' }: OwnerStoreKpiStripProps) {
  if (loading) {
    return <p style={styles.hint}>{t('ownerDashboard.kpiLoading')}</p>;
  }
  if (!kpi) return null;

  const alerts: { label: string; value: number; tone: 'warn' | 'danger' }[] = [];
  if (kpi.pending_accept > 0) {
    alerts.push({ label: t('ownerDashboard.kpiPendingAccept'), value: kpi.pending_accept, tone: 'danger' });
  }
  if (kpi.awaiting_ship > 0) {
    alerts.push({ label: t('ownerDashboard.kpiAwaitingShip'), value: kpi.awaiting_ship, tone: 'danger' });
  }
  if (kpi.on_hold > 0) {
    alerts.push({ label: t('ownerDashboard.kpiOnHold'), value: kpi.on_hold, tone: 'warn' });
  }
  if (kpi.low_stock_count > 0) {
    alerts.push({ label: t('ownerDashboard.kpiLowStock'), value: kpi.low_stock_count, tone: 'warn' });
  }
  if (kpi.auto_accept_exhausted_count > 0) {
    alerts.push({
      label: t('ownerDashboard.kpiAutoAcceptOut'),
      value: kpi.auto_accept_exhausted_count,
      tone: 'warn',
    });
  }

  const showCardHeader = variant === 'card';

  return (
    <div style={variant === 'page' ? styles.wrapPage : styles.wrapCard}>
      {showCardHeader && (
        <div style={styles.sectionHead}>
          <h3 style={styles.sectionTitle}>{t('ownerDashboard.statsSectionTitle')}</h3>
          <p style={styles.sectionHint}>{t('ownerDashboard.statsSectionHint')}</p>
        </div>
      )}

      <div style={styles.grid}>
        <KpiCell
          title={t('ownerDashboard.kpiTodayTitle')}
          countLabel={t('ownerDashboard.kpiOrderCount', {
            n: formatIntegerDisplay(kpi.today_order_count),
          })}
          revenueLabel={t('ownerDashboard.kpiRevenueLabel', {
            amount: formatWon(kpi.today_revenue),
          })}
        />
        <KpiCell
          title={t('ownerDashboard.kpiPopupTitle')}
          countLabel={t('ownerDashboard.kpiOrderCount', {
            n: formatIntegerDisplay(kpi.popup_order_count),
          })}
          revenueLabel={t('ownerDashboard.kpiRevenueLabel', {
            amount: formatWon(kpi.popup_revenue),
          })}
        />
      </div>

      {alerts.length > 0 && (
        <div style={styles.todoBlock}>
          <span style={styles.todoTitle}>{t('ownerDashboard.kpiTodoTitle')}</span>
          <div style={styles.alertRow}>
            {alerts.map((a) => (
              <span
                key={a.label}
                style={a.tone === 'danger' ? styles.alertDanger : styles.alertWarn}
              >
                {a.label} {formatIntegerDisplay(a.value)}
              </span>
            ))}
          </div>
        </div>
      )}

      {showCardHeader && (
        <p style={styles.moreHint}>{t('ownerDashboard.statsMoreHint')}</p>
      )}
    </div>
  );
}

function KpiCell({
  title,
  countLabel,
  revenueLabel,
}: {
  title: string;
  countLabel: string;
  revenueLabel: string;
}) {
  return (
    <div style={styles.cell}>
      <span style={styles.cellTitle}>{title}</span>
      <strong style={styles.cellCount}>{countLabel}</strong>
      <span style={styles.cellRevenue}>{revenueLabel}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapCard: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${oc.border}`,
  },
  wrapPage: {
    marginBottom: 20,
    padding: '16px 18px',
    background: oc.surfaceMuted,
    borderRadius: 10,
    border: `1px solid ${oc.border}`,
  },
  sectionHead: { marginBottom: 12 },
  sectionTitle: {
    margin: 0,
    fontSize: fs.base,
    fontWeight: 700,
    color: oc.text,
  },
  sectionHint: {
    margin: '6px 0 0',
    fontSize: fs.sm,
    color: oc.textMuted,
    lineHeight: 1.5,
  },
  hint: { margin: '12px 0 0', fontSize: fs.sm, color: oc.textMuted },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  cell: {
    background: oc.surface,
    borderRadius: 8,
    padding: '12px 14px',
    border: `1px solid ${oc.borderStrong}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  cellTitle: { fontSize: fs.sm, fontWeight: 600, color: oc.textSecondary },
  cellCount: { fontSize: fs.lg, color: oc.text, fontWeight: 700 },
  cellRevenue: { fontSize: fs.sm, color: oc.primary, fontWeight: 600 },
  todoBlock: { marginTop: 12 },
  todoTitle: {
    display: 'block',
    fontSize: fs.xs,
    fontWeight: 600,
    color: oc.textSecondary,
    marginBottom: 6,
  },
  alertRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  alertDanger: {
    fontSize: fs.xs,
    padding: '4px 8px',
    borderRadius: 999,
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
  },
  alertWarn: {
    fontSize: fs.xs,
    padding: '4px 8px',
    borderRadius: 999,
    background: oc.warningBg,
    color: oc.warningText,
    border: `1px solid ${oc.warningBorder}`,
  },
  moreHint: {
    margin: '12px 0 0',
    fontSize: fs.xs,
    color: oc.textMuted,
    lineHeight: 1.5,
  },
};
