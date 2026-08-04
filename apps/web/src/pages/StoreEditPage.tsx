import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyStore, publishStore, userOwnsStore } from '../lib/stores';
import { OwnerProductPanel } from '../components/OwnerProductPanel';
import { OwnerOrdersPanel } from '../components/OwnerOrdersPanel';
import { OwnerDisplayPanel } from '../components/OwnerDisplayPanel';
import { DemoToast } from '../components/DemoToast';
import { useOwnerOrderRealtime } from '../hooks/useOwnerOrderRealtime';
import { t } from '../i18n';
import type { StoreSummary } from '@popup-cube/shared';

type EditTab = 'overview' | 'products' | 'orders' | 'fulfillment' | 'layout';

function formatBadgeCount(n: number): string {
  if (n <= 0) return '';
  return n > 99 ? '99+' : String(n);
}

export function StoreEditPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { userId, role, loading: authLoading, signOut } = useAuth();

  const [tab, setTab] = useState<EditTab>('overview');
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [publishErr, setPublishErr] = useState(false);
  const [ownershipChecked, setOwnershipChecked] = useState(false);
  const [ownsStore, setOwnsStore] = useState(false);

  const {
    pendingAccept,
    awaitingShip,
    toastMessage,
    dismissToast,
    refreshTick,
  } = useOwnerOrderRealtime(ownershipChecked && ownsStore ? storeId : undefined, {
    suppressNewOrderToast: tab === 'orders',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }
    if (role === 'shopper') {
      navigate('/app-only', { replace: true });
      return;
    }
    if (!storeId || role !== 'owner') {
      navigate('/home', { replace: true });
      return;
    }

    let active = true;
    setOwnershipChecked(false);
    void userOwnsStore(userId, storeId).then((ok) => {
      if (!active) return;
      setOwnsStore(ok);
      setOwnershipChecked(true);
      if (!ok) navigate('/home', { replace: true });
    });

    return () => {
      active = false;
    };
  }, [authLoading, userId, role, storeId, navigate]);

  async function loadStore() {
    if (!storeId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getMyStore(storeId);
      setStore(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId || !ownershipChecked || !ownsStore) return;
    loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, ownershipChecked, ownsStore]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  async function handlePublish() {
    if (!storeId || store?.status === 'published') return;
    setPublishing(true);
    setPublishMsg(null);
    setPublishErr(false);
    try {
      const updated = await publishStore(storeId);
      setStore(updated);
      setPublishMsg(t('ownerEdit.publishSuccess'));
    } catch {
      setPublishErr(true);
    } finally {
      setPublishing(false);
    }
  }

  if (authLoading || !userId || !storeId || !ownershipChecked || !ownsStore) {
    return <div style={styles.page}>{t('ownerEdit.loading')}</div>;
  }

  const tabs: { id: EditTab; label: string; badge?: number }[] = [
    { id: 'overview', label: t('ownerEdit.tabOverview') },
    { id: 'products', label: t('ownerEdit.tabProducts') },
    { id: 'orders', label: t('ownerEdit.tabOrders'), badge: pendingAccept },
    { id: 'fulfillment', label: t('ownerEdit.tabFulfillment'), badge: awaitingShip },
    { id: 'layout', label: t('ownerEdit.tabLayout') },
  ];

  const isDraft = store?.status === 'draft';

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.kicker}>{t('ownerEdit.kicker')}</p>
          <h1 style={styles.title}>{store?.name ?? t('ownerEdit.loading')}</h1>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.ghostButton} type="button" onClick={() => navigate('/home')}>
            {t('ownerEdit.backDashboard')}
          </button>
          <button style={styles.ghostButton} type="button" onClick={handleSignOut}>
            {t('common.logout')}
          </button>
        </div>
      </header>

      <div style={styles.shell}>
        <nav style={styles.sidebar}>
          {tabs.map((item) => {
            const badgeText = formatBadgeCount(item.badge ?? 0);
            return (
              <button
                key={item.id}
                type="button"
                style={{
                  ...styles.navItem,
                  ...(tab === item.id ? styles.navItemActive : {}),
                }}
                onClick={() => setTab(item.id)}
              >
                <span style={styles.navLabel}>{item.label}</span>
                {badgeText ? <span style={styles.navBadge}>{badgeText}</span> : null}
              </button>
            );
          })}
        </nav>

        <main style={styles.main}>
          {loading && <p style={styles.hint}>{t('ownerEdit.loading')}</p>}
          {!loading && error && <p style={styles.error}>{t('ownerEdit.errorLoad')}</p>}

          {!loading && !error && tab === 'overview' && store && (
            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>{t('ownerEdit.overviewTitle')}</h2>
              <div style={styles.overviewRow}>
                <div style={styles.thumbWrap}>
                  {store.thumbnail_url ? (
                    <img src={store.thumbnail_url} alt="" style={styles.thumb} />
                  ) : (
                    <div style={styles.thumbFallback}>{store.name.charAt(0)}</div>
                  )}
                </div>
                <div style={styles.overviewMeta}>
                  <div style={styles.statusRow}>
                    <span style={styles.metaLabel}>{t('ownerEdit.statusLabel')}</span>
                    <span style={isDraft ? styles.statusBadgeDraft : styles.statusBadgePublished}>
                      {isDraft ? t('ownerEdit.statusDraft') : t('ownerEdit.statusPublished')}
                    </span>
                  </div>
                  <p style={styles.description}>
                    {store.description?.trim() || t('ownerEdit.noDescription')}
                  </p>
                  <p style={styles.note}>{isDraft ? t('ownerEdit.draftNote') : t('ownerEdit.publishedNote')}</p>
                  {isDraft && (
                    <button
                      type="button"
                      style={styles.publishButton}
                      disabled={publishing}
                      onClick={handlePublish}
                    >
                      {publishing ? t('ownerEdit.publishing') : t('ownerEdit.publishButton')}
                    </button>
                  )}
                  {publishMsg && <p style={styles.success}>{publishMsg}</p>}
                  {publishErr && <p style={styles.error}>{t('ownerEdit.publishError')}</p>}
                </div>
              </div>
            </section>
          )}

          {!loading && !error && tab === 'products' && userId && storeId && (
            <OwnerProductPanel storeId={storeId} userId={userId} embedded />
          )}

          {!loading && !error && tab === 'orders' && storeId && (
            <OwnerOrdersPanel
              storeId={storeId}
              embedded
              queue="pending"
              refreshTick={refreshTick}
            />
          )}

          {!loading && !error && tab === 'fulfillment' && storeId && (
            <OwnerOrdersPanel
              storeId={storeId}
              embedded
              queue="fulfillment"
              refreshTick={refreshTick}
            />
          )}

          {!loading && !error && tab === 'layout' && storeId && (
            <OwnerDisplayPanel storeId={storeId} embedded />
          )}
        </main>
      </div>

      <DemoToast message={toastMessage} onDismiss={dismissToast} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    padding: '20px 28px',
    background: '#0f3460',
    flexWrap: 'wrap',
  },
  kicker: { margin: 0, fontSize: 12, color: '#a0a0c0', letterSpacing: 0.5 },
  title: { margin: '4px 0 0', fontSize: 22 },
  headerActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  ghostButton: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#d8e4ff',
    fontSize: 13,
    cursor: 'pointer',
  },
  shell: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: 0,
    minHeight: 'calc(100vh - 88px)',
  },
  sidebar: {
    background: '#16213e',
    borderRight: '1px solid #2c4270',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    textAlign: 'left',
    padding: '12px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#a0a0c0',
    fontSize: 14,
    cursor: 'pointer',
  },
  navItemActive: {
    background: '#0f3460',
    color: '#fff',
    fontWeight: 600,
  },
  navLabel: { flex: 1, minWidth: 0 },
  navBadge: {
    flexShrink: 0,
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: 999,
    background: '#e94560',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: '20px',
    textAlign: 'center',
  },
  main: { padding: '24px 28px', maxWidth: 1200 },
  panel: {
    background: '#16213e',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #2c4270',
  },
  panelTitle: { margin: '0 0 16px', fontSize: 18 },
  overviewRow: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  thumbWrap: {
    width: 160,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    background: '#0f3460',
    flexShrink: 0,
  },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    fontWeight: 700,
    opacity: 0.6,
  },
  overviewMeta: { flex: 1, minWidth: 220 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  metaLabel: { color: '#a0a0c0', fontSize: 13 },
  statusBadgePublished: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 999,
    background: '#173a2c',
    color: '#8ce0b0',
    border: '1px solid #2c6b4a',
  },
  statusBadgeDraft: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 999,
    background: '#3a2f17',
    color: '#ffd580',
    border: '1px solid #6b5a2c',
  },
  description: { color: '#d8e4ff', fontSize: 14, lineHeight: 1.6, margin: 0 },
  note: { color: '#a0a0c0', fontSize: 13, marginTop: 16, lineHeight: 1.5 },
  publishButton: {
    marginTop: 16,
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  success: { color: '#8ce0b0', fontSize: 13, marginTop: 12 },
  hint: { color: '#a0a0c0', fontSize: 14, lineHeight: 1.6 },
  error: { color: '#ff6b6b', fontSize: 14 },
};
