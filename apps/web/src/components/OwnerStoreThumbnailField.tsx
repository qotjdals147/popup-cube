import { useEffect, useRef, useState } from 'react';
import { ImageCropDialog } from './ImageCropDialog';
import { updateStoreThumbnail } from '../lib/stores';
import { StoreThumbnailError } from '../lib/storeThumbnail';
import type { StoreSummary } from '@popup-cube/shared';
import { ownerColors as oc, ownerFieldLabel, ownerFontSize as fs, ownerHelpText } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

interface OwnerStoreThumbnailFieldProps {
  userId: string;
  store: StoreSummary;
  onUpdated: (store: StoreSummary) => void;
}

export function OwnerStoreThumbnailField({ userId, store, onUpdated }: OwnerStoreThumbnailFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [localPreview, cropSrc]);

  function openFilePicker() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg(null);
    setErr(null);
    const url = URL.createObjectURL(file);
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function closeCrop() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function handleCropped(file: File) {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const updated = await updateStoreThumbnail(store.id, userId, file);
      onUpdated(updated);
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setMsg(t('ownerEdit.thumbnailSaved'));
      closeCrop();
    } catch (e) {
      if (e instanceof StoreThumbnailError && e.code === 'TOO_LARGE') {
        setErr(t('ownerEdit.thumbnailTooLarge'));
      } else {
        setErr(t('ownerEdit.thumbnailSaveError'));
      }
      closeCrop();
    } finally {
      setSaving(false);
    }
  }

  const displayUrl = localPreview ?? store.thumbnail_url;

  return (
    <div style={styles.block}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{t('ownerEdit.thumbnailLabel')}</span>
        {saving && <span style={styles.saving}>{t('ownerEdit.thumbnailSaving')}</span>}
      </div>
      <p style={styles.help}>{t('ownerEdit.thumbnailHint')}</p>

      <div style={styles.row}>
        <div style={styles.thumbWrap}>
          {displayUrl ? (
            <img src={displayUrl} alt="" style={styles.thumb} />
          ) : (
            <div style={styles.thumbFallback}>{store.name.charAt(0)}</div>
          )}
        </div>
        <div style={styles.actions}>
          <button type="button" style={styles.btn} onClick={openFilePicker} disabled={saving}>
            {displayUrl ? t('ownerEdit.thumbnailChange') : t('ownerEdit.thumbnailSelect')}
          </button>
          <p style={styles.cropNote}>{t('ownerEdit.thumbnailCropNote')}</p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {msg && <p style={styles.ok}>{msg}</p>}
      {err && <p style={styles.error}>{err}</p>}

      {cropSrc && (
        <ImageCropDialog
          imageSrc={cropSrc}
          title={t('imageCrop.storeTitle')}
          previewHint={t('imageCrop.storeHint')}
          onCancel={closeCrop}
          onConfirm={handleCropped}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  block: { marginBottom: 20 },
  labelRow: { display: 'flex', alignItems: 'center', gap: 10 },
  label: { ...ownerFieldLabel, margin: '0 0 4px' },
  help: { ...ownerHelpText, margin: '0 0 10px' },
  row: { display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
  thumbWrap: {
    width: 160,
    height: 120,
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
    fontSize: 36,
    fontWeight: 700,
    color: oc.textMuted,
  },
  actions: { flex: 1, minWidth: 200 },
  btn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cropNote: { margin: '8px 0 0', fontSize: fs.xs, color: oc.textSecondary, lineHeight: 1.45 },
  saving: { fontSize: fs.xs, color: oc.textSecondary },
  ok: { margin: '8px 0 0', fontSize: fs.sm, color: oc.successText },
  error: { margin: '8px 0 0', fontSize: fs.sm, color: oc.dangerText },
};
