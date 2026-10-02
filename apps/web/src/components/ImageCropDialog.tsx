import { useCallback, useState, type CSSProperties } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getCroppedImageBlob, STORE_THUMBNAIL_ASPECT } from '../lib/cropImage';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

interface ImageCropDialogProps {
  imageSrc: string;
  title: string;
  aspect?: number;
  previewHint?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}

export function ImageCropDialog({
  imageSrc,
  title,
  aspect = STORE_THUMBNAIL_ASPECT,
  previewHint,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], 'store-thumbnail.jpg', { type: 'image/jpeg' });
      await onConfirm(file);
    } catch {
      setErr(t('imageCrop.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="image-crop-title">
      <div style={styles.sheet}>
        <h3 id="image-crop-title" style={styles.title}>
          {title}
        </h3>
        {previewHint && <p style={styles.hint}>{previewHint}</p>}

        <div style={styles.cropWrap}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <label style={styles.zoomLabel} htmlFor="crop-zoom">
          {t('imageCrop.zoom')}
        </label>
        <input
          id="crop-zoom"
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={styles.zoomRange}
        />

        <p style={styles.frameNote}>{t('imageCrop.frameNote')}</p>

        {err && <p style={styles.error}>{err}</p>}

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button type="button" style={styles.okBtn} onClick={() => void handleApply()} disabled={busy}>
            {busy ? t('imageCrop.applying') : t('imageCrop.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 5000,
    background: oc.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: ownerFont,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    background: oc.surface,
    borderRadius: 14,
    padding: 20,
    boxShadow: oc.shadowMd,
    border: `1px solid ${oc.border}`,
    boxSizing: 'border-box',
  },
  title: { margin: '0 0 8px', fontSize: fs.lg, fontWeight: 700, color: oc.text },
  hint: { margin: '0 0 12px', fontSize: fs.sm, color: oc.textSecondary, lineHeight: 1.45 },
  cropWrap: {
    position: 'relative',
    width: '100%',
    height: 280,
    borderRadius: 10,
    overflow: 'hidden',
    background: '#111',
    marginBottom: 12,
  },
  zoomLabel: { display: 'block', fontSize: fs.sm, fontWeight: 600, color: oc.text, marginBottom: 4 },
  zoomRange: { width: '100%', marginBottom: 14 },
  frameNote: { margin: '0 0 14px', fontSize: fs.xs, color: oc.textSecondary, lineHeight: 1.45 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    cursor: 'pointer',
    fontSize: fs.sm,
  },
  okBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: fs.sm,
  },
  error: { color: oc.dangerText, fontSize: fs.sm, margin: '0 0 10px' },
};
