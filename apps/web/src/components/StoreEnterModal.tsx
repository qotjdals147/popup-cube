import type { StoreSummary } from '@popup-cube/shared';
import { t } from '../i18n';

interface StoreEnterModalProps {
  store: StoreSummary;
  onEnter: () => void;
  onClose: () => void;
}

export function StoreEnterModal({ store, onEnter, onClose }: StoreEnterModalProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
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

        <h2 style={styles.name}>{store.name}</h2>
        <p style={styles.commerceNote}>{t('enterModal.commerceNote')}</p>
        <p style={styles.description}>{store.description || t('enterModal.noDescription')}</p>

        <div style={styles.actions}>
          <button style={styles.enterButton} onClick={onEnter}>
            {t('enterModal.enter')}
          </button>
          <button style={styles.closeButton} onClick={onClose}>
            {t('enterModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  card: {
    background: '#0f3460',
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  thumbnailWrap: {
    width: '100%',
    height: 200,
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
    fontSize: 48,
    fontWeight: 700,
    opacity: 0.6,
  },
  name: { color: '#fff', fontSize: 20, margin: '20px 20px 8px' },
  commerceNote: {
    color: '#7dffb2',
    fontSize: 12,
    margin: '0 20px 8px',
    fontWeight: 500,
  },
  description: {
    color: '#a0a0c0',
    fontSize: 13,
    lineHeight: 1.6,
    margin: '0 20px 20px',
    minHeight: 40,
  },
  actions: { display: 'flex', gap: 10, padding: '0 20px 20px' },
  enterButton: {
    flex: 1,
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeButton: {
    padding: '12px 18px',
    borderRadius: 10,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#a0a0c0',
    fontSize: 14,
    cursor: 'pointer',
  },
};
