import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createStore, CreateStoreError } from '../lib/storeCreate';
import { t } from '../i18n';

export function CreateStorePage() {
  const { userId, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !userId) {
      navigate('/');
    }
  }, [authLoading, userId, navigate]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setThumbnailFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (!name.trim() || !description.trim() || !thumbnailFile) {
      setError(t('createStore.errorRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { storeId } = await createStore(userId, {
        name,
        description,
        thumbnailFile,
      });
      await refreshProfile();
      navigate(`/store/${storeId}`);
    } catch (err) {
      if (err instanceof CreateStoreError && err.code === 'THUMBNAIL_TOO_LARGE') {
        setError(t('createStore.errorThumbnailTooLarge'));
      } else {
        setError(t('createStore.errorGeneric'));
      }
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate('/home')}
        >
          {t('common.back')}
        </button>

        <h2 style={styles.title}>{t('createStore.title')}</h2>
        <p style={styles.subtitle}>{t('createStore.subtitle')}</p>

        <label style={styles.label}>{t('createStore.nameLabel')}</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('createStore.namePlaceholder')}
          maxLength={80}
        />

        <label style={styles.label}>{t('createStore.thumbnailLabel')}</label>
        <p style={styles.hint}>{t('createStore.thumbnailHint')}</p>
        <div style={styles.thumbnailRow}>
          <div style={styles.thumbnailPreviewWrap}>
            {previewUrl ? (
              <img src={previewUrl} alt="" style={styles.thumbnailPreview} />
            ) : (
              <div style={styles.thumbnailPlaceholder}>🖼️</div>
            )}
          </div>
          <button
            type="button"
            style={styles.fileButton}
            onClick={() => fileInputRef.current?.click()}
          >
            {thumbnailFile ? t('createStore.thumbnailChange') : t('createStore.thumbnailSelect')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <label style={styles.label}>{t('createStore.descriptionLabel')}</label>
        <textarea
          style={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('createStore.descriptionPlaceholder')}
          maxLength={500}
          rows={4}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.submitButton} type="submit" disabled={submitting}>
          {submitting ? t('createStore.submitting') : t('createStore.submit')}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    padding: 16,
  },
  card: {
    background: '#0f3460',
    padding: '32px',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#a0a0c0',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 12,
  },
  title: { color: '#fff', fontSize: 20, margin: 0 },
  subtitle: { color: '#a0a0c0', fontSize: 13, marginTop: 8, marginBottom: 24, lineHeight: 1.5 },
  label: { display: 'block', color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 6 },
  hint: { color: '#a0a0c0', fontSize: 12, marginTop: -2, marginBottom: 8 },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: 16,
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#16213e',
    color: '#fff',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    marginBottom: 16,
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#16213e',
    color: '#fff',
    fontSize: 14,
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  thumbnailRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  thumbnailPreviewWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    background: '#16213e',
    border: '1px solid #2c4270',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbnailPlaceholder: { fontSize: 24, opacity: 0.5 },
  fileButton: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: 'transparent',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
  error: { color: '#ff6b6b', fontSize: 13, marginBottom: 12 },
  submitButton: {
    width: '100%',
    padding: '13px',
    borderRadius: 10,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
