import { useCallback, useEffect, useState } from 'react';
import type { StoreNewsPost } from '../lib/storeNews';
import {
  deleteOwnerStoreNewsPost,
  insertOwnerStoreNewsPost,
  listOwnerStoreNewsPosts,
  updateOwnerStoreNewsPost,
} from '../lib/storeNews';
import { ownerColors as oc, ownerFieldLabel, ownerFontSize as fs, ownerHelpText } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

const MAX_POSTS = 12;

interface OwnerStoreNewsEditorProps {
  storeId: string;
}

export function OwnerStoreNewsEditor({ storeId }: OwnerStoreNewsEditorProps) {
  const [posts, setPosts] = useState<StoreNewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listOwnerStoreNewsPosts(storeId);
      setPosts(list);
    } catch {
      setError(t('ownerStoreNews.loadError'));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleAdd() {
    if (posts.length >= MAX_POSTS) return;
    setBusyId('new');
    setError(null);
    try {
      await insertOwnerStoreNewsPost(storeId, {
        title: t('ownerStoreNews.defaultTitle'),
        body: null,
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

  async function patchPost(id: string, partial: Partial<StoreNewsPost>) {
    setBusyId(id);
    setError(null);
    try {
      await updateOwnerStoreNewsPost(id, partial);
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...partial } : p)));
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
      <h3 style={styles.sectionTitle}>{t('ownerStoreNews.sectionTitle')}</h3>
      <p style={styles.intro}>{t('ownerStoreNews.intro')}</p>
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
                      onChange={(e) => void patchPost(post.id, { is_active: e.target.checked })}
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
                <label style={styles.label}>{t('ownerStoreNews.titleLabel')}</label>
                <input
                  style={styles.input}
                  value={post.title}
                  maxLength={80}
                  disabled={busyId === post.id}
                  onChange={(e) => setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, title: e.target.value } : p)))}
                  onBlur={(e) => {
                    const title = e.target.value.trim();
                    if (title && title !== post.title) void patchPost(post.id, { title });
                  }}
                />
                <label style={styles.label}>{t('ownerStoreNews.bodyLabel')}</label>
                <textarea
                  style={styles.textarea}
                  rows={2}
                  value={post.body ?? ''}
                  disabled={busyId === post.id}
                  onChange={(e) => setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, body: e.target.value } : p)))}
                  onBlur={(e) => {
                    const body = e.target.value;
                    if (body !== (post.body ?? '')) void patchPost(post.id, { body });
                  }}
                  placeholder={t('ownerStoreNews.bodyPlaceholder')}
                />
              </article>
            ))}
          </div>
          <button
            type="button"
            style={styles.addBtn}
            disabled={posts.length >= MAX_POSTS || busyId === 'new'}
            onClick={() => void handleAdd()}
          >
            {t('ownerStoreNews.add')}
          </button>
          <p style={styles.help}>{t('ownerStoreNews.limitHint', { max: MAX_POSTS })}</p>
        </>
      )}
      {error && <p style={styles.error}>{error}</p>}
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
  label: ownerFieldLabel,
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
    marginBottom: 8,
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
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
