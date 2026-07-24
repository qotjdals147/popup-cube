import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { StoreSummary } from '@popup-cube/shared';
import { useAuth } from '../context/AuthContext';
import { listPublishedStores } from '../lib/stores';
import { StoreEnterModal } from '../components/StoreEnterModal';
import { t } from '../i18n';

export function HomePage() {
  const { userId, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreSummary | null>(null);
  const [idleNotice, setIdleNotice] = useState(
    Boolean((location.state as { idleKicked?: boolean } | null)?.idleKicked)
  );

  useEffect(() => {
    if (!idleNotice) return;
    // 뒤로가기 등으로 state가 남아 반복 노출되지 않도록 한 번 보여주고 히스토리에서 지움.
    navigate('.', { replace: true, state: null });
    const timer = setTimeout(() => setIdleNotice(false), 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authLoading && !userId) {
      navigate('/');
    }
  }, [authLoading, userId, navigate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    const timer = setTimeout(() => {
      listPublishedStores(search)
        .then((data) => {
          if (active) setStores(data);
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTitles}>
          <h1 style={styles.title}>{t('home.title')}</h1>
          <p style={styles.tagline}>{t('home.tagline')}</p>
        </div>
        <input
          style={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('home.searchPlaceholder')}
        />
        <button style={styles.myPageButton} onClick={() => navigate('/mypage')}>
          {t('common.myPage')}
        </button>
        <button style={styles.logoutButton} onClick={handleSignOut}>
          {t('common.logout')}
        </button>
      </header>

      {idleNotice && <div style={styles.idleNotice}>{t('home.idleKickedNotice')}</div>}

      {role === 'owner' && (
        <div style={styles.ownerBar}>
          <button style={styles.createButton} onClick={() => navigate('/store/create')}>
            {t('home.createStore')}
          </button>
        </div>
      )}

      <main style={styles.main}>
        {loading && <p style={styles.status}>{t('home.loading')}</p>}
        {!loading && error && <p style={styles.statusError}>{t('home.errorLoad')}</p>}

        {!loading && !error && stores.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>{t('home.emptyTitle')}</p>
            <p style={styles.emptySubtitle}>
              {search ? t('home.emptySubtitleSearch') : t('home.emptySubtitle')}
            </p>
          </div>
        )}

        {!loading && !error && stores.length > 0 && (
          <div style={styles.grid}>
            {stores.map((store) => (
              <button
                key={store.id}
                style={styles.card}
                onClick={() => setSelectedStore(store)}
              >
                <div style={styles.thumbnailWrap}>
                  {store.thumbnail_url ? (
                    <img
                      src={store.thumbnail_url}
                      alt={store.name}
                      style={styles.thumbnail}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={styles.thumbnailFallback}>{store.name.charAt(0)}</div>
                  )}
                </div>
                <div style={styles.cardName}>{store.name}</div>
              </button>
            ))}
          </div>
        )}
      </main>

      {selectedStore && (
        <StoreEnterModal
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          onEnter={() => navigate(`/store/${selectedStore.id}`)}
        />
      )}
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
    alignItems: 'center',
    gap: 16,
    padding: '16px 24px',
    background: '#0f3460',
    flexWrap: 'wrap',
  },
  headerTitles: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 140 },
  title: { fontSize: 20, margin: 0, letterSpacing: 0.5, whiteSpace: 'nowrap' },
  tagline: { margin: 0, fontSize: 12, color: '#a0a0c0' },
  search: {
    flex: 1,
    minWidth: 160,
    padding: '10px 14px',
    borderRadius: 20,
    border: '1px solid #2c4270',
    background: '#16213e',
    color: '#fff',
    fontSize: 13,
  },
  myPageButton: {
    background: 'transparent',
    border: '1px solid #2c4270',
    color: '#fff',
    borderRadius: 6,
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    background: 'transparent',
    border: '1px solid #a0a0c0',
    color: '#a0a0c0',
    borderRadius: 6,
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  idleNotice: {
    padding: '10px 24px',
    background: '#3a2f10',
    color: '#ffd580',
    fontSize: 13,
    borderBottom: '1px solid #6b5320',
  },
  ownerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 24px',
    background: '#533483',
  },
  createButton: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  main: { padding: '24px', maxWidth: 1080, margin: '0 auto' },
  status: { color: '#a0a0c0', fontSize: 14, textAlign: 'center', marginTop: 40 },
  statusError: { color: '#ff6b6b', fontSize: 14, textAlign: 'center', marginTop: 40 },
  empty: { textAlign: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, color: '#fff', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#a0a0c0' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    background: '#0f3460',
    border: 'none',
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },
  thumbnailWrap: {
    width: '100%',
    height: 140,
    background: 'linear-gradient(135deg, #533483, #16213e)',
  },
  thumbnail: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 36,
    fontWeight: 700,
    opacity: 0.6,
  },
  cardName: { padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#fff' },
};
