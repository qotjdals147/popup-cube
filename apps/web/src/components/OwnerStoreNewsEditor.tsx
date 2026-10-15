import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@popup-cube/shared';
import type { Area } from 'react-easy-crop';
import { STORE_NEWS_CARD_ASPECT } from '../lib/cropImage';
import { formatPxSize, STORE_NEWS_CARD_PX } from '../lib/imageSizeGuide';
import { OwnerImageSizeCallout } from './OwnerImageSizeCallout';
import { parseImageCropPercent } from '../lib/mediaCropDisplay';
import { useAuth } from '../context/AuthContext';
import { CroppedSquareMedia } from './CroppedSquareMedia';
import { ImageCropDialog, type ImageCropDialogResult } from './ImageCropDialog';
import { listMyProducts } from '../lib/products';
import type { StoreNewsPost } from '../lib/storeNews';
import {
  deleteOwnerStoreNewsPost,
  insertOwnerStoreNewsPost,
  listOwnerStoreNewsPosts,
  MAX_STORE_NEWS_MEDIA_BYTES,
  updateOwnerStoreNewsPost,
  uploadStoreNewsMedia,
} from '../lib/storeNews';
import { ownerColors as oc, ownerFieldLabel, ownerFontSize as fs, ownerHelpText } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

const MAX_POSTS = 12;

interface OwnerStoreNewsEditorProps {
  storeId: string;
}

export function OwnerStoreNewsEditor({ storeId }: OwnerStoreNewsEditorProps) {
  const { userId } = useAuth();
  const [posts, setPosts] = useState<StoreNewsPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);
  const pendingUploadRef = useRef<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropExportMode, setCropExportMode] = useState<'file' | 'framing'>('file');
  const [cropInitialArea, setCropInitialArea] = useState<Area | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, prods] = await Promise.all([listOwnerStoreNewsPosts(storeId), listMyProducts(storeId)]);
      setPosts(list);
      setProducts(prods.filter((p) => p.is_active));
    } catch {
      setError(t('ownerStoreNews.loadError'));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openFilePicker(replacePostId: string | null) {
    replaceTargetRef.current = replacePostId;
    fileInputRef.current?.click();
  }

  function closeCrop() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function persistUploadedFile(file: File, replaceId: string | null, imageCrop: Area | null) {
    if (!userId) return;

    if (replaceId) {
      setBusyId(replaceId);
      try {
        const url = await uploadStoreNewsMedia(userId, storeId, file);
        await updateOwnerStoreNewsPost(replaceId, { image_url: url, image_crop: imageCrop });
        await reload();
      } catch {
        setError(t('ownerStoreNews.saveError'));
      } finally {
        setBusyId(null);
      }
      return;
    }

    if (posts.length >= MAX_POSTS) return;
    setBusyId('new');
    try {
      const url = await uploadStoreNewsMedia(userId, storeId, file);
      await insertOwnerStoreNewsPost(storeId, {
        image_url: url,
        image_crop: imageCrop,
        link_product_id: null,
        is_active: true,
        sort_order: posts.length,
      });
      await reload();
    } catch {
      setError(t('ownerStoreNews.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  function openCropUi(src: string, mode: 'file' | 'framing', initial?: Area) {
    setCropExportMode(mode);
    setCropInitialArea(initial);
    setCropSrc((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return src;
    });
  }

  async function handleFileSelected(file: File | undefined) {
    if (!file || !userId) return;
    if (file.size > MAX_STORE_NEWS_MEDIA_BYTES) {
      setError(t('ownerStoreNews.mediaTooLarge'));
      return;
    }

    setError(null);
    pendingUploadRef.current = file;
    const isGif = file.type === 'image/gif';
    openCropUi(URL.createObjectURL(file), isGif ? 'framing' : 'file');
  }

  function openReframeCrop(post: StoreNewsPost) {
    if (!post.image_url) return;
    replaceTargetRef.current = post.id;
    pendingUploadRef.current = null;
    openCropUi(
      post.image_url,
      'framing',
      parseImageCropPercent(post.image_crop) ?? undefined,
    );
  }

  async function handleCropConfirm(result: ImageCropDialogResult) {
    const replaceId = replaceTargetRef.current;
    replaceTargetRef.current = null;
    closeCrop();

    if (result.kind === 'file') {
      pendingUploadRef.current = null;
      await persistUploadedFile(result.file, replaceId, null);
      return;
    }

    const crop = result.cropPercent;
    const pending = pendingUploadRef.current;
    pendingUploadRef.current = null;

    if (pending) {
      await persistUploadedFile(pending, replaceId, crop);
      return;
    }

    if (replaceId) {
      setBusyId(replaceId);
      setError(null);
      try {
        await updateOwnerStoreNewsPost(replaceId, { image_crop: crop });
        await reload();
      } catch {
        setError(t('ownerStoreNews.saveError'));
      } finally {
        setBusyId(null);
      }
    }
  }

  async function patchLink(postId: string, linkProductId: string | null) {
    setBusyId(postId);
    setError(null);
    try {
      await updateOwnerStoreNewsPost(postId, { link_product_id: linkProductId });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, link_product_id: linkProductId } : p)),
      );
    } catch {
      setError(t('ownerStoreNews.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  async function patchActive(postId: string, is_active: boolean) {
    setBusyId(postId);
    setError(null);
    try {
      await updateOwnerStoreNewsPost(postId, { is_active });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, is_active } : p)));
    } catch {
      setError(t('ownerStoreNews.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm(t('ownerStoreNews.deleteConfirm'))) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteOwnerStoreNewsPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError(t('ownerStoreNews.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.section}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          void handleFileSelected(f);
        }}
      />
      <h3 style={styles.sectionTitle}>{t('ownerStoreNews.sectionTitle')}</h3>
      <OwnerImageSizeCallout>
        {t('ownerStoreNews.sizeHint', {
          size: formatPxSize(STORE_NEWS_CARD_PX.width, STORE_NEWS_CARD_PX.height),
        })}
      </OwnerImageSizeCallout>
      <p style={styles.intro}>{t('ownerStoreNews.introMedia')}</p>
      {loading ? (
        <p style={styles.hint}>{t('ownerStoreNews.loading')}</p>
      ) : (
        <>
          <div style={styles.list}>
            {posts.length === 0 && <p style={styles.hint}>{t('ownerStoreNews.empty')}</p>}
            {posts.map((post, index) => (
              <article key={post.id} style={styles.card}>
                <div style={styles.cardHead}>
                  <span style={styles.orderBadge}>{index + 1}</span>
                  <label style={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={post.is_active !== false}
                      disabled={busyId === post.id}
                      onChange={(e) => void patchActive(post.id, e.target.checked)}
                    />
                    <span>{t('ownerStoreNews.activeLabel')}</span>
                  </label>
                  <button
                    type="button"
                    style={styles.removeBtn}
                    disabled={busyId === post.id}
                    onClick={() => void handleRemove(post.id)}
                  >
                    {t('ownerStoreNews.delete')}
                  </button>
                </div>
                <div style={styles.previewWrap}>
                  {post.image_url ? (
                    <CroppedSquareMedia src={post.image_url} crop={post.image_crop} />
                  ) : (
                    <div style={styles.previewPlaceholder}>{t('ownerStoreNews.noImageYet')}</div>
                  )}
                </div>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busyId === post.id || !userId}
                  onClick={() => openFilePicker(post.id)}
                >
                  {post.image_url ? t('ownerStoreNews.changeImage') : t('ownerStoreNews.uploadImage')}
                </button>
                {post.image_url && (
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    disabled={busyId === post.id}
                    onClick={() => openReframeCrop(post)}
                  >
                    {t('ownerStoreNews.reframeCrop')}
                  </button>
                )}
                <label style={styles.label}>{t('ownerStoreNews.linkLabel')}</label>
                <select
                  style={styles.select}
                  disabled={busyId === post.id}
                  value={post.link_product_id ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    void patchLink(post.id, v ? v : null);
                  }}
                >
                  <option value="">{t('ownerStoreNews.linkStore')}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p style={styles.cardHelp}>{t('ownerStoreNews.linkHelp')}</p>
              </article>
            ))}
          </div>
          <button
            type="button"
            style={styles.addBtn}
            disabled={posts.length >= MAX_POSTS || busyId === 'new' || !userId}
            onClick={() => openFilePicker(null)}
          >
            {busyId === 'new' ? t('ownerStoreNews.uploading') : t('ownerStoreNews.addMedia')}
          </button>
          <p style={styles.help}>{t('ownerStoreNews.cropNote')}</p>
          <p style={styles.help}>{t('ownerStoreNews.limitHint', { max: MAX_POSTS })}</p>
        </>
      )}
      {error && <p style={styles.error}>{error}</p>}

      {cropSrc && (
        <ImageCropDialog
          imageSrc={cropSrc}
          aspect={STORE_NEWS_CARD_ASPECT}
          cropOutputWidth={STORE_NEWS_CARD_PX.width}
          title={t('imageCrop.storeNewsTitle')}
          previewHint={t('imageCrop.storeNewsHint')}
          exportMode={cropExportMode}
          initialCroppedAreaPercentages={cropInitialArea}
          onCancel={() => {
            replaceTargetRef.current = null;
            pendingUploadRef.current = null;
            closeCrop();
          }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: `1px solid ${oc.border}`,
  },
  sectionTitle: { margin: '0 0 8px', fontSize: fs.lg, color: oc.text, fontWeight: 700 },
  intro: { ...ownerHelpText, margin: '0 0 16px' },
  hint: { color: oc.textMuted, fontSize: fs.base, margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    padding: 14,
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surfaceMuted,
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  orderBadge: {
    fontSize: fs.sm,
    fontWeight: 700,
    color: oc.textSecondary,
    minWidth: 24,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: oc.text,
    fontSize: fs.sm,
    cursor: 'pointer',
    flex: 1,
  },
  removeBtn: {
    marginLeft: 'auto',
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.danger,
    fontSize: fs.sm,
    cursor: 'pointer',
  },
  previewWrap: {
    width: '100%',
    maxWidth: 200,
    aspectRatio: '1',
    borderRadius: 10,
    overflow: 'hidden',
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    marginBottom: 10,
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: oc.textMuted,
    fontSize: fs.sm,
    padding: 8,
    textAlign: 'center',
  },
  secondaryBtn: {
    marginBottom: 12,
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.primary,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  label: ownerFieldLabel,
  select: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
  },
  cardHelp: { ...ownerHelpText, margin: '8px 0 0' },
  addBtn: {
    marginTop: 12,
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px dashed ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.primary,
    fontSize: fs.base,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
  help: { ...ownerHelpText, margin: '8px 0 0' },
  error: { color: oc.danger, fontSize: fs.sm, margin: '8px 0 0' },
};
