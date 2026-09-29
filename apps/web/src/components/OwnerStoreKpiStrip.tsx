import type { StoreKpi } from '../lib/storeKpi';
import { formatWon } from '../lib/storeKpi';
import { formatIntegerDisplay } from '../lib/formatInteger';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerStoreKpiStripProps {
  kpi: StoreKpi | null;
  loading?: boolean;
}

export function OwnerStoreKpiStrip({ kpi, loading }: OwnerStoreKpiStripProps) {
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

  return (
    <div style={styles.wrap}>
      <div style={styles.grid}>
        <KpiCell
          label={t('ownerDashboard.kpiTodayOrders')}
          value={formatIntegerDisplay(kpi.today_order_count)}
          sub={formatWon(kpi.today_revenue)}
        />
        <KpiCell
          label={t('ownerDashboard.kpiPopupOrders')}
          value={formatIntegerDisplay(kpi.popup_order_count)}
          sub={formatWon(kpi.popup_revenue)}
        />
      </div>
      {alerts.length > 0 && (
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
      )}
    </div>
  );
}

function KpiCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={styles.cell}>
      <span style={styles.cellLabel}>{label}</span>
      <strong style={styles.cellValue}>{value}</strong>
      <span style={styles.cellSub}>{sub}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${oc.border}`,
  },
  hint: { margin: '12px 0 0', fontSize: fs.sm, color: oc.textMuted },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  cell: {
    background: oc.surfaceMuted,
    borderRadius: 8,
    padding: '10px 12px',
    border: `1px solid ${oc.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  cellLabel: { fontSize: fs.xs, color: oc.textMuted },
  cellValue: { fontSize: fs.lg, color: oc.text, fontWeight: 700 },
  cellSub: { fontSize: fs.xs, color: oc.textSecondary },
  alertRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
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
};
