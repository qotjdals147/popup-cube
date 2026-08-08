import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AddressManagementPanel } from '../components/AddressManagementPanel';
import { t } from '../i18n';

/**
 * 마이페이지 — 배송지 관리 (AD-030). PC 브라우저 직접 접근용.
 * 앱 손님은 `/app/me` WebView 「내 정보」 사용.
 */
export function MyPage() {
  const { userId, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !userId) navigate('/');
  }, [authLoading, userId, navigate]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button type="button" style={styles.backButton} onClick={() => navigate('/home')}>
          {t('common.back')}
        </button>
        <h1 style={styles.title}>{t('mypage.title')}</h1>
      </header>

      <main style={styles.main}>
        <AddressManagementPanel />
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
    alignItems: 'center',
    gap: 14,
    padding: '16px 24px',
    background: '#0f3460',
  },
  backButton: {
    background: 'transparent',
    border: '1px solid #2c4270',
    color: '#fff',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 12,
  },
  title: { fontSize: 18, margin: 0 },
  main: { padding: '24px', maxWidth: 720, margin: '0 auto' },
};
