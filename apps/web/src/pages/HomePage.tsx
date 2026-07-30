import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyStore } from '../lib/stores';
import { t } from '../i18n';
import type { StoreSummary } from '@popup-cube/shared';

/** AD-037 — PC 웹 점주 대시보드 (매장 목록·쇼핑 허브 아님) */
export function HomePage() {
  const { userId, role, storeId, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      navigate('/', { replace: true });
    }
  }, [authLoading, userId, navigate]);

  useEffect(() => {
    if (!storeId || role !== 'owner') {
      setStore(null);
      return;
    }

    let active = true;
    setLoading(true);
    getMyStore(storeId)
      .then((data) => {
        if (active) setStore(data);
      })
      .catch(() => {
        if (active) setStore(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeId, role]);

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
            {!loading && store && (
              <>
                <div style={styles.storeRow}>
                  <div style={styles.thumbWrap}>
                    {store.thumbnail_url ? (
                      <img src={store.thumbnail_url} alt="" style={styles.thumb} />
                    ) : (
                      <div style={styles.thumbFallback}>{store.name.charAt(0)}</div>
                    )}
                  </div>
                  <div>
                    <div style={styles.nameRow}>
                      <h2 style={styles.storeName}>{store.name}</h2>
                      <span
                        style={
                          store.status === 'draft' ? styles.badgeDraft : styles.badgePublished
                        }
                      >
                        {store.status === 'draft'
                          ? t('ownerDashboard.statusDraft')
                          : t('ownerDashboard.statusPublished')}
                      </span>
                    </div>
                    <p style={styles.storeDesc}>
                      {store.description?.trim() || t('ownerEdit.noDescription')}
                    </p>
                  </div>
                </div>
                <button
                  style={styles.primaryButton}
                  type="button"
                  onClick={() => navigate(`/store/${storeId}/edit`)}
                >
                  {t('ownerDashboard.manageStore')}
                </button>
              </>
            )}
            {!loading && !store && (
              <>
                <p style={styles.body}>{t('ownerDashboard.storeMissing')}</p>
                <button style={styles.primaryButton} type="button" onClick={() => navigate('/store/create')}>
                  {t('ownerDashboard.createStore')}
                </button>
              </>
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
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '20px 28px',
    background: '#0f3460',
    flexWrap: 'wrap',
  },
  title: { fontSize: 22, margin: 0 },
  tagline: { margin: '4px 0 0', fontSize: 13, color: '#a0a0c0' },
  logoutButton: {
    background: 'transparent',
    border: '1px solid #a0a0c0',
    color: '#a0a0c0',
    borderRadius: 6,
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: 12,
  },
  main: { padding: '28px', maxWidth: 720, margin: '0 auto' },
  panel: {
    background: '#16213e',
    borderRadius: 12,
    padding: 28,
    border: '1px solid #2c4270',
  },
  panelTitle: { margin: '0 0 12px', fontSize: 18 },
  body: { color: '#d8e4ff', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' },
  hint: { color: '#a0a0c0', fontSize: 14 },
  storeRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  thumbWrap: {
    width: 120,
    height: 90,
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
    fontSize: 32,
    fontWeight: 700,
    opacity: 0.6,
  },
  storeName: { margin: 0, fontSize: 18 },
  nameRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  badgePublished: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 999,
    background: '#173a2c',
    color: '#8ce0b0',
    border: '1px solid #2c6b4a',
  },
  badgeDraft: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 999,
    background: '#3a2f17',
    color: '#ffd580',
    border: '1px solid #6b5a2c',
  },
  storeDesc: { margin: '8px 0 0', fontSize: 13, color: '#a0a0c0', lineHeight: 1.5 },
  primaryButton: {
    padding: '12px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    marginTop: 12,
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#8ea6dd',
    fontSize: 13,
    cursor: 'pointer',
  },
};

