import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  deleteSponsoredBanner,
  insertSponsoredBanner,
  listPlatformSponsoredBanners,
  updateSponsoredBanner,
  uploadSponsoredBannerImage,
  type SponsoredBannerRow,
} from '../lib/sponsoredBanners';
import { ownerColors as oc, ownerFieldLabel, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function PlatformHomeBannersPage() {
  const { userId, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SponsoredBannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listPlatformSponsoredBanners();
      setRows(list);
    } catch {
      setError(t('platformHomeBanners.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }
    if (role !== 'admin') {
      navigate('/home', { replace: true });
      return;
    }
    void reload();
  }, [authLoading, userId, role, navigate, reload]);

  async function handleAdd() {
    setBusyId('new');
    setError(null);
    try {
      await insertSponsoredBanner({
        title: t('platformHomeBanners.defaultTitle'),
        subtitle: null,
        image_url:
          'data:image/svg+xml,' +
          encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320"><rect fill="#e2e8f0" width="100%" height="100%"/></svg>'),
        store_id: null,
        product_id: null,
        link_url: null,
        sort_order: rows.length,
        starts_at: null,
        ends_at: null,
        is_active: false,
      });
      await reload();
    } catch {
      setError(t('platformHomeBanners.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  async function patchRow(id: string, partial: Parameters<typeof updateSponsoredBanner>[1]) {
    setBusyId(id);
    setError(null);
    try {
      await updateSponsoredBanner(id, partial);
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const next = { ...r, ...partial, updated_at: new Date().toISOString() };
          if (partial.title !== undefined) next.title = partial.title.trim();
          if (partial.subtitle !== undefined) next.subtitle = partial.subtitle?.trim() || null;
          if (partial.image_url !== undefined) next.image_url = partial.image_url.trim();
          return next;
        }),
      );
    } catch {
      setError(t('platformHomeBanners.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleImagePick(id: string, file: File | null) {
    if (!file || !userId) return;
    setBusyId(id);
    setError(null);
    try {
      const url = await uploadSponsoredBannerImage(userId, file);
      await patchRow(id, { image_url: url });
    } catch (e) {
      if (e instanceof Error && e.message === 'banner_image_too_large') {
        setError(t('platformHomeBanners.imageTooLarge'));
      } else {
        setError(t('platformHomeBanners.saveError'));
      }
      setBusyId(null);
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm(t('platformHomeBanners.deleteConfirm'))) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteSponsoredBanner(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError(t('platformHomeBanners.saveError'));
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || role !== 'admin') {
    return <div style={styles.page}>{t('platformHomeBanners.loading')}</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <button type="button" style={styles.backBtn} onClick={() => navigate('/home')}>
            {t('common.back')}
          </button>
          <h1 style={styles.title}>{t('platformHomeBanners.title')}</h1>
          <p style={styles.lead}>{t('platformHomeBanners.lead')}</p>
        </div>
        <button type="button" style={styles.primaryBtn} onClick={() => void handleAdd()} disabled={busyId === 'new'}>
          {t('platformHomeBanners.add')}
        </button>
      </header>

      <main style={styles.main}>
        {error && <p style={styles.error}>{error}</p>}
        {loading ? (
          <p style={styles.hint}>{t('platformHomeBanners.loading')}</p>
        ) : (
          <div style={styles.list}>
            {rows.length === 0 && <p style={styles.hint}>{t('platformHomeBanners.empty')}</p>}
            {rows.map((row, index) => (
              <article key={row.id} style={styles.card}>
                <div style={styles.cardHead}>
                  <span style={styles.badge}>{index + 1}</span>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) => void patchRow(row.id, { is_active: e.target.checked })}
                    />
                    {t('platformHomeBanners.active')}
                  </label>
                  <button
                    type="button"
                    style={styles.dangerBtn}
                    onClick={() => void handleRemove(row.id)}
                    disabled={busyId === row.id}
                  >
                    {t('platformHomeBanners.delete')}
                  </button>
                </div>
                <div style={styles.previewRow}>
                  <img src={row.image_url} alt="" style={styles.preview} />
                  <label style={styles.fileLabel}>
                    {t('platformHomeBanners.replaceImage')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => void handleImagePick(row.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <label style={ownerFieldLabel}>
                  {t('platformHomeBanners.fieldTitle')}
                  <input
                    style={styles.input}
                    value={row.title}
                    maxLength={80}
                    onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r)))}
                    onBlur={(e) => void patchRow(row.id, { title: e.target.value })}
                  />
                </label>
                <label style={ownerFieldLabel}>
                  {t('platformHomeBanners.fieldSubtitle')}
                  <input
                    style={styles.input}
                    value={row.subtitle ?? ''}
                    maxLength={120}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, subtitle: e.target.value } : r)))
                    }
                    onBlur={(e) => void patchRow(row.id, { subtitle: e.target.value || null })}
                  />
                </label>
                <label style={ownerFieldLabel}>
                  {t('platformHomeBanners.fieldStoreId')}
                  <input
                    style={styles.input}
                    value={row.store_id ?? ''}
                    placeholder="popup_gucci_01"
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, store_id: e.target.value } : r)))
                    }
                    onBlur={(e) => void patchRow(row.id, { store_id: e.target.value || null })}
                  />
                </label>
                <label style={ownerFieldLabel}>
                  {t('platformHomeBanners.fieldProductId')}
                  <input
                    style={styles.input}
                    value={row.product_id ?? ''}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, product_id: e.target.value || null } : r)))
                    }
                    onBlur={(e) => void patchRow(row.id, { product_id: e.target.value.trim() || null })}
                  />
                </label>
                <label style={ownerFieldLabel}>
                  {t('platformHomeBanners.fieldLinkUrl')}
                  <input
                    style={styles.input}
                    value={row.link_url ?? ''}
                    onChange={(e) =>
                      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, link_url: e.target.value } : r)))
                    }
                    onBlur={(e) => void patchRow(row.id, { link_url: e.target.value || null })}
                  />
                </label>
                <div style={styles.row2}>
                  <label style={ownerFieldLabel}>
                    {t('platformHomeBanners.fieldStarts')}
                    <input
                      type="datetime-local"
                      style={styles.input}
                      value={toLocalInput(row.starts_at)}
                      onChange={(e) => void patchRow(row.id, { starts_at: fromLocalInput(e.target.value) })}
                    />
                  </label>
                  <label style={ownerFieldLabel}>
                    {t('platformHomeBanners.fieldEnds')}
                    <input
                      type="datetime-local"
                      style={styles.input}
                      value={toLocalInput(row.ends_at)}
                      onChange={(e) => void patchRow(row.id, { ends_at: fromLocalInput(e.target.value) })}
                    />
                  </label>
                </div>
                <label style={ownerFieldLabel}>
                  {t('platformHomeBanners.fieldSort')}
                  <input
                    type="number"
                    style={styles.inputNarrow}
                    value={row.sort_order}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) => (r.id === row.id ? { ...r, sort_order: Number(e.target.value) || 0 } : r)),
                      )
                    }
                    onBlur={(e) => void patchRow(row.id, { sort_order: Number(e.target.value) || 0 })}
                  />
                </label>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: oc.pageBg, color: oc.text, fontFamily: ownerFont },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    padding: '24px 32px',
    borderBottom: `1px solid ${oc.border}`,
    background: oc.cardBg,
  },
  backBtn: { border: 'none', background: 'none', color: oc.textSoft, cursor: 'pointer', fontSize: fs.sm, marginBottom: 8 },
  title: { margin: 0, fontSize: 22, fontWeight: 800 },
  lead: { margin: '8px 0 0', color: oc.textSoft, fontSize: fs.sm, maxWidth: 520 },
  main: { maxWidth: 720, margin: '0 auto', padding: '24px 20px 48px' },
  primaryBtn: {
    background: '#3182f6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: oc.cardBg,
    border: `1px solid ${oc.border}`,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  badge: {
    background: oc.border,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: fs.xs,
    fontWeight: 700,
  },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: fs.sm, flex: 1 },
  dangerBtn: {
    marginLeft: 'auto',
    border: `1px solid ${oc.border}`,
    background: '#fff',
    color: '#e94560',
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: fs.sm,
  },
  previewRow: { display: 'flex', gap: 12, alignItems: 'center' },
  preview: { width: 160, height: 64, objectFit: 'cover', borderRadius: 8, border: `1px solid ${oc.border}` },
  fileLabel: {
    fontSize: fs.sm,
    color: '#3182f6',
    cursor: 'pointer',
    fontWeight: 600,
  },
  input: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${oc.border}`,
    fontSize: fs.sm,
  },
  inputNarrow: { display: 'block', width: 80, marginTop: 4, padding: '8px 10px', borderRadius: 8, border: `1px solid ${oc.border}` },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  hint: { color: oc.textSoft, fontSize: fs.sm },
  error: { color: '#e94560', fontSize: fs.sm, marginBottom: 12 },
};
