import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listOwnedStores } from '../lib/stores';
import { DEMO_STORE_ID } from '@popup-cube/shared';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';
import type { StoreSummary } from '@popup-cube/shared';

/** AD-037 — PC 웹 점주 대시보드 (매장 목록·쇼핑 허브 아님) */
export function HomePage() {
  const { userId, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!userId || role !== 'owner') {
      setStores([]);
      return;
    }

    setLoading(true);
    try {
      const data = await listOwnedStores(userId);
      const sorted = [...data].sort((a, b) => {
        if (a.id === DEMO_STORE_ID) return -1;
        if (b.id === DEMO_STORE_ID) return 1;
        return a.name.localeCompare(b.name, 'ko');
      });
      setStores(sorted);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      navigate('/', { replace: true });
    }
  }, [authLoading, userId, navigate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (authLoading || !userId) {
    return <div style={styles.page}>{t('ownerDashboard.loading')}</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('ownerDashboard.title')}</h1>
          <p style={styles.tagline}>{t('ownerDashboard.tagline')}</p>
        </div>
        <button style={styles.logoutButton} type="button" onClick={handleSignOut}>
          {t('common.logout')}
        </button>
      </header>

      <main style={styles.main}>
        {role === 'shopper' && (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>{t('ownerDashboard.noStoreTitle')}</h2>
            <p style={styles.body}>{t('ownerDashboard.noStoreBody')}</p>
            <button style={styles.primaryButton} type="button" onClick={() => navigate('/store/create')}>
              {t('ownerDashboard.createStore')}
            </button>
            <button style={styles.secondaryButton} type="button" onClick={() => navigate('/app-only')}>
              {t('ownerDashboard.shopperAppLink')}
            </button>
          </section>
        )}

        {role === 'owner' && (
          <section style={styles.panel}>
            {loading && <p style={styles.hint}>{t('ownerDashboard.loading')}</p>}

            {!loading && stores.length > 0 && (
              <div style={styles.storeList}>
                {stores.map((store) => {
                  const isPublished = store.status === 'published';

                  return (
                    <article key={store.id} style={styles.storeCard}>
                      <div style={styles.cardBody}>
                        <div style={styles.thumbWrap}>
                          {store.thumbnail_url ? (
                            <img src={store.thumbnail_url} alt="" style={styles.thumb} />
                          ) : (
                            <div style={styles.thumbFallback}>{store.name.charAt(0)}</div>
                          )}
                        </div>
                        <div style={styles.cardMain}>
                          <div style={styles.nameRow}>
                            <h2 style={styles.storeName}>{store.name}</h2>
                            <span style={isPublished ? styles.badgePublished : styles.badgeDraft}>
                              {isPublished
                                ? t('ownerDashboard.statusPublished')
                                : t('ownerDashboard.statusDraft')}
                            </span>
                          </div>
                          <p style={styles.storeDesc}>
                            {store.description?.trim() || t('ownerEdit.noDescription')}
                          </p>
                        </div>
                      </div>
                      <div style={styles.cardActions}>
                        <button
                          style={styles.primaryButton}
                          type="button"
                          onClick={() => navigate(`/store/${store.id}/edit`)}
                        >
                          {t('ownerDashboard.manageStore')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && stores.length === 0 && (
              <>
                <p style={styles.body}>{t('ownerDashboard.storeMissing')}</p>
                <button style={styles.primaryButton} type="button" onClick={() => navigate('/store/create')}>
                  {t('ownerDashboard.createStore')}
                </button>
              </>
            )}

            {!loading && stores.length > 0 && (
              <div style={styles.footerActions}>
                <button style={styles.secondaryButton} type="button" onClick={() => navigate('/store/create')}>
                  {t('ownerDashboard.createStore')}
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: oc.pageBg,
    color: oc.text,
    fontFamily: ownerFont,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '16px 28px',
    background: oc.headerBg,
    borderBottom: `1px solid ${oc.border}`,
    flexWrap: 'wrap',
  },
  title: { fontSize: fs.xxl, margin: 0, color: oc.text, fontWeight: 700 },
  tagline: { margin: '4px 0 0', fontSize: fs.sm, color: oc.textMuted },
  logoutButton: {
    background: oc.surface,
    border: `1px solid ${oc.borderStrong}`,
    color: oc.textSecondary,
    borderRadius: 8,
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: fs.sm,
  },
  main: { padding: '28px', maxWidth: 720, margin: '0 auto' },
  panel: {
    background: oc.surface,
    borderRadius: 12,
    padding: '20px 22px',
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadow,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 140px)',
  },
  panelTitle: { margin: '0 0 12px', fontSize: fs.lg, color: oc.text, fontWeight: 600 },
  body: { color: oc.textSecondary, fontSize: fs.base, lineHeight: 1.6, margin: '0 0 20px' },
  hint: { color: oc.textMuted, fontSize: fs.base, margin: 0 },
  storeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    paddingRight: 4,
  },
  storeCard: {
    background: oc.surface,
    borderRadius: 12,
    padding: '16px 18px',
    border: `2px solid ${oc.borderStrong}`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  cardBody: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  thumbWrap: {
    width: 96,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    flexShrink: 0,
  },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: oc.textMuted,
    background: oc.surfaceMuted,
  },
  cardMain: { flex: 1, minWidth: 0 },
  storeName: { margin: 0, fontSize: fs.lg, color: oc.text, fontWeight: 600 },
  nameRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  badgePublished: {
    fontSize: fs.xs,
    padding: '3px 8px',
    borderRadius: 999,
    background: oc.successBg,
    color: oc.successText,
    border: `1px solid ${oc.successBorder}`,
  },
  badgeDraft: {
    fontSize: fs.xs,
    padding: '3px 8px',
    borderRadius: 999,
    background: oc.warningBg,
    color: oc.warningText,
    border: `1px solid ${oc.warningBorder}`,
  },
  storeDesc: {
    margin: 0,
    fontSize: fs.sm,
    color: oc.textMuted,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTop: `1px solid ${oc.border}`,
  },
  primaryButton: {
    padding: '9px 16px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '9px 16px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.textSecondary,
    fontSize: fs.sm,
    fontWeight: 500,
    cursor: 'pointer',
  },
  footerActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: `1px solid ${oc.border}`,
    flexShrink: 0,
  },
};
