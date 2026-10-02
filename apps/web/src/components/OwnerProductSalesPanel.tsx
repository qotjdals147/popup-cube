import { useEffect, useState } from 'react';
import {
  formatWon,
  getStoreProductSales,
  getStoreSalesDaily,
  type StoreProductSalesRow,
  type StoreSalesDailyRow,
} from '../lib/storeKpi';
import { formatIntegerDisplay } from '../lib/formatInteger';
import { t } from '../i18n';
import { ownerColors as oc, ownerFontSize as fs } from '../styles/ownerAdminTheme';

interface OwnerProductSalesPanelProps {
  storeId: string;
  variant?: 'page' | 'embed';
}

export function OwnerProductSalesPanel({ storeId, variant = 'page' }: OwnerProductSalesPanelProps) {
  const [daily, setDaily] = useState<StoreSalesDailyRow[]>([]);
  const [topProducts, setTopProducts] = useState<StoreProductSalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void (async () => {
      try {
        const [d, p] = await Promise.all([
          getStoreSalesDaily(storeId, 7),
          getStoreProductSales(storeId, 6),
        ]);
        if (cancelled) return;
        setDaily(d);
        setTopProducts(p);
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

  if (loading) {
    return <p style={styles.hint}>{t('ownerProducts.salesStatsLoading')}</p>;
  }
  if (error) {
    return <p style={styles.error}>{t('ownerProducts.salesStatsError')}</p>;
  }

  const maxRevenue = Math.max(1, ...daily.map((r) => r.revenue));
  const maxProductRev = Math.max(1, ...topProducts.map((r) => r.revenue));

  const hasAnyData =
    daily.some((r) => r.order_count > 0) || topProducts.length > 0;

  const sectionStyle = variant === 'page' ? styles.sectionPage : styles.section;

  return (
    <section style={sectionStyle}>
      <h3 style={styles.title}>{t('ownerStats.chartSectionTitle')}</h3>
      <p style={styles.intro}>{t('ownerStats.chartSectionIntro')}</p>

      {!hasAnyData ? (
        <p style={styles.hint}>{t('ownerProducts.salesStatsEmpty')}</p>
      ) : (
        <>
          <div style={styles.chartBlock}>
            <span style={styles.chartLabel}>{t('ownerProducts.salesDailyChart')}</span>
            <div style={styles.barChart} role="img" aria-label={t('ownerProducts.salesDailyChart')}>
              {daily.map((row) => {
                const h = Math.round((row.revenue / maxRevenue) * 100);
                const dayLabel = row.sales_day.slice(5).replace('-', '/');
                return (
                  <div key={row.sales_day} style={styles.barCol} title={`${dayLabel}: ${formatWon(row.revenue)}`}>
                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, height: `${Math.max(h, row.revenue > 0 ? 8 : 0)}%` }} />
                    </div>
                    <span style={styles.barDay}>{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {topProducts.length > 0 && (
            <div style={styles.topBlock}>
              <span style={styles.chartLabel}>{t('ownerProducts.salesTopSku')}</span>
              <ul style={styles.topList}>
                {topProducts.map((p) => {
                  const w = Math.round((p.revenue / maxProductRev) * 100);
                  return (
                    <li key={p.product_id} style={styles.topRow}>
                      <div style={styles.thumbWrap}>
                        {p.image_url ? (
                          <img src={p.image_url} alt="" style={styles.thumb} />
                        ) : (
                          <div style={styles.thumbFallback}>📦</div>
                        )}
                      </div>
                      <div style={styles.topMain}>
                        <span style={styles.topName}>{p.product_name}</span>
                        <div style={styles.miniBarTrack}>
                          <div style={{ ...styles.miniBarFill, width: `${w}%` }} />
                        </div>
                        <span style={styles.topMeta}>
                          {t('ownerProducts.salesTopMeta', {
                            units: formatIntegerDisplay(p.units_sold),
                            revenue: formatWon(p.revenue),
                          })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 20,
    padding: '16px 18px',
    background: oc.surfaceMuted,
    borderRadius: 10,
    border: `1px solid ${oc.border}`,
  },
  sectionPage: {
    padding: 0,
    background: 'transparent',
    border: 'none',
    marginBottom: 0,
  },
  title: { margin: '0 0 6px', fontSize: fs.base, fontWeight: 600, color: oc.text },
  intro: { margin: '0 0 14px', fontSize: fs.sm, color: oc.textMuted, lineHeight: 1.5 },
  hint: { margin: 0, fontSize: fs.sm, color: oc.textMuted },
  error: { margin: 0, fontSize: fs.sm, color: oc.dangerText },
  chartBlock: { marginBottom: 16 },
  chartLabel: { display: 'block', fontSize: fs.xs, color: oc.textSecondary, marginBottom: 8, fontWeight: 600 },
  barChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 6,
    height: 88,
    padding: '0 4px',
  },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 },
  barTrack: {
    width: '100%',
    maxWidth: 36,
    height: 64,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  barFill: {
    width: '100%',
    maxWidth: 28,
    borderRadius: '4px 4px 0 0',
    background: oc.primary,
    minHeight: 0,
  },
  barDay: { fontSize: 10, color: oc.textMuted, marginTop: 4 },
  topBlock: {},
  topList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 },
  topRow: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  thumbWrap: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    border: `1px solid ${oc.border}`,
    background: oc.surface,
  },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  topMain: { flex: 1, minWidth: 0 },
  topName: {
    display: 'block',
    fontSize: fs.sm,
    fontWeight: 600,
    color: oc.text,
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  miniBarTrack: {
    height: 6,
    borderRadius: 3,
    background: oc.border,
    marginBottom: 4,
    overflow: 'hidden',
  },
  miniBarFill: { height: '100%', background: oc.primary, borderRadius: 3 },
  topMeta: { fontSize: fs.xs, color: oc.textMuted },
};
