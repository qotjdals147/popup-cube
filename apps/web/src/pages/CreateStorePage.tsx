import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createStore, CreateStoreError } from '../lib/storeCreate';
import { isValidStoreCode, normalizeStoreCode, suggestStoreCodeFromName } from '../lib/orderRef';
import { ownerColors as oc, ownerFont } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

export function CreateStorePage() {
  const { userId, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
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

  function handleNameChange(value: string) {
    setName(value);
    if (!codeTouched) {
      setStoreCode(suggestStoreCodeFromName(value));
    }
  }

  function handleStoreCodeChange(value: string) {
    setCodeTouched(true);
    setStoreCode(normalizeStoreCode(value));
  }

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

    const code = normalizeStoreCode(storeCode);

    if (!name.trim() || !description.trim() || !thumbnailFile) {
      setError(t('createStore.errorRequired'));
      return;
    }

    if (!isValidStoreCode(code)) {
      setError(t('createStore.errorStoreCodeInvalid'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { storeId } = await createStore(userId, {
        name,
        storeCode: code,
        description,
        thumbnailFile,
      });
      await refreshProfile();
      navigate(`/store/${storeId}/edit`);
    } catch (err) {
      if (err instanceof CreateStoreError && err.code === 'THUMBNAIL_TOO_LARGE') {
        setError(t('createStore.errorThumbnailTooLarge'));
      } else if (err instanceof CreateStoreError && err.code === 'UPLOAD_FAILED') {
        setError(t('createStore.errorUploadFailed'));
      } else if (
        err instanceof CreateStoreError &&
        (err.message?.includes('store_code') ||
          err.message?.toLowerCase().includes('duplicate') ||
          err.message?.includes('stores_store_code_key'))
      ) {
        setError(t('createStore.errorStoreCodeDuplicate'));
      } else if (err instanceof CreateStoreError && err.message && err.message !== 'CREATE_FAILED') {
        setError(err.message);
      } else {
        setError(t('createStore.errorGeneric'));
      }
      setSubmitting(false);
    }
  }

  const previewRef =
    storeCode && isValidStoreCode(storeCode)
      ? t('createStore.storeCodePreview', { code: storeCode, number: '1042' })
      : null;

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <button type="button" style={styles.backButton} onClick={() => navigate('/home')}>
          {t('common.back')}
        </button>

        <h2 style={styles.title}>{t('createStore.title')}</h2>
        <p style={styles.subtitle}>{t('createStore.subtitle')}</p>

        <label style={styles.label}>{t('createStore.nameLabel')}</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t('createStore.namePlaceholder')}
          maxLength={80}
        />

        <label style={styles.label}>{t('createStore.storeCodeLabel')}</label>
        <p style={styles.hint}>{t('createStore.storeCodeHint')}</p>
        <input
          style={styles.input}
          value={storeCode}
          onChange={(e) => handleStoreCodeChange(e.target.value)}
          placeholder={t('createStore.storeCodePlaceholder')}
          maxLength={12}
          autoCapitalize="characters"
          spellCheck={false}
        />
        {previewRef && <p style={styles.preview}>{previewRef}</p>}

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
    background: oc.pageBg,
    fontFamily: ownerFont,
    padding: 16,
  },
  card: {
    background: oc.surface,
    padding: '32px',
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
    boxShadow: oc.shadowMd,
    border: `1px solid ${oc.border}`,
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: oc.textMuted,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 12,
  },
  title: { color: oc.text, fontSize: 20, margin: 0, fontWeight: 700 },
  subtitle: { color: oc.textMuted, fontSize: 13, marginTop: 8, marginBottom: 24, lineHeight: 1.5 },
  label: { display: 'block', color: oc.text, fontSize: 13, fontWeight: 600, marginBottom: 6 },
  hint: { color: oc.textMuted, fontSize: 12, marginTop: -2, marginBottom: 8, lineHeight: 1.45 },
  preview: { color: oc.orderRef, fontSize: 12, marginTop: -8, marginBottom: 16, fontWeight: 600 },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: 16,
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: 14,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    marginBottom: 16,
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
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
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbnailPlaceholder: { fontSize: 24, color: oc.textMuted },
  fileButton: {
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.textSecondary,
    fontSize: 13,
    cursor: 'pointer',
  },
  error: { color: oc.danger, fontSize: 13, marginBottom: 12 },
  submitButton: {
    width: '100%',
    padding: '13px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
