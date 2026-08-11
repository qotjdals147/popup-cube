import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyStore, publishStore, updateStoreCode, userOwnsStore } from '../lib/stores';
import { OwnerProductPanel } from '../components/OwnerProductPanel';
import { OwnerOrdersPanel } from '../components/OwnerOrdersPanel';
import { OwnerDisplayPanel } from '../components/OwnerDisplayPanel';
import { DemoToast } from '../components/DemoToast';
import { useOwnerOrderRealtime } from '../hooks/useOwnerOrderRealtime';
import { isValidStoreCode, normalizeStoreCode } from '../lib/orderRef';
import { ownerColors as oc, ownerFont, ownerFontSize as fs } from '../styles/ownerAdminTheme';
import { t } from '../i18n';
import type { StoreSummary } from '@popup-cube/shared';

type EditTab = 'overview' | 'products' | 'orders' | 'fulfillment' | 'layout';

function formatBadgeCount(n: number): string {
  if (n <= 0) return '';
  return n > 99 ? '99+' : String(n);
}

export function StoreEditPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { userId, role, loading: authLoading, signOut } = useAuth();

  const [tab, setTab] = useState<EditTab>('overview');
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [publishErr, setPublishErr] = useState(false);
  const [storeCodeDraft, setStoreCodeDraft] = useState('');
  const [savingStoreCode, setSavingStoreCode] = useState(false);
  const [storeCodeMsg, setStoreCodeMsg] = useState<string | null>(null);
  const [storeCodeErr, setStoreCodeErr] = useState(false);
  const [ownershipChecked, setOwnershipChecked] = useState(false);
  const [ownsStore, setOwnsStore] = useState(false);

  const {
    pendingAccept,
    awaitingShip,
    toastMessage,
    dismissToast,
    refreshTick,
  } = useOwnerOrderRealtime(ownershipChecked && ownsStore ? storeId : undefined, {
    suppressNewOrderToast: tab === 'orders',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }
    if (role === 'shopper') {
      navigate('/app-only', { replace: true });
      return;
    }
    if (!storeId || role !== 'owner') {
      navigate('/home', { replace: true });
      return;
    }

    let active = true;
    setOwnershipChecked(false);
    void userOwnsStore(userId, storeId).then((ok) => {
      if (!active) return;
      setOwnsStore(ok);
      setOwnershipChecked(true);
      if (!ok) navigate('/home', { replace: true });
    });

    return () => {
      active = false;
    };
  }, [authLoading, userId, role, storeId, navigate]);

  async function loadStore() {
    if (!storeId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getMyStore(storeId);
      setStore(data);
      setStoreCodeDraft(data?.store_code ?? '');
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId || !ownershipChecked || !ownsStore) return;
    loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, ownershipChecked, ownsStore]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  async function handleSaveStoreCode() {
    if (!storeId) return;
    const code = normalizeStoreCode(storeCodeDraft);
    if (!isValidStoreCode(code)) {
      setStoreCodeErr(true);
      setStoreCodeMsg(t('ownerEdit.storeCodeInvalid'));
      return;
    }
    setSavingStoreCode(true);
    setStoreCodeMsg(null);
    setStoreCodeErr(false);
    try {
      const updated = await updateStoreCode(storeId, code);
      setStore(updated);
      setStoreCodeDraft(updated.store_code);
      setStoreCodeMsg(t('ownerEdit.storeCodeSaved'));
    } catch {
      setStoreCodeErr(true);
      setStoreCodeMsg(t('ownerEdit.storeCodeSaveError'));
    } finally {
      setSavingStoreCode(false);
    }
  }

  async function handlePublish() {
    if (!storeId || store?.status === 'published') return;
    setPublishing(true);
    setPublishMsg(null);
    setPublishErr(false);
    try {
      const updated = await publishStore(storeId);
      setStore(updated);
      setPublishMsg(t('ownerEdit.publishSuccess'));
    } catch {
      setPublishErr(true);
    } finally {
      setPublishing(false);
    }
  }

  if (authLoading || !userId || !storeId || !ownershipChecked || !ownsStore) {
    return <div style={styles.page}>{t('ownerEdit.loading')}</div>;
  }

  const tabs: { id: EditTab; label: string; badge?: number }[] = [
    { id: 'overview', label: t('ownerEdit.tabOverview') },
    { id: 'products', label: t('ownerEdit.tabProducts') },
    { id: 'orders', label: t('ownerEdit.tabOrders'), badge: pendingAccept },
    { id: 'fulfillment', label: t('ownerEdit.tabFulfillment'), badge: awaitingShip },
    { id: 'layout', label: t('ownerEdit.tabLayout') },
  ];

  const isDraft = store?.status === 'draft';

  const activeTabLabel = tabs.find((item) => item.id === tab)?.label ?? '';

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarBrand}>
            <p style={styles.sidebarKicker}>{t('ownerEdit.kicker')}</p>
            <h1 style={styles.sidebarTitle}>{store?.name ?? t('ownerEdit.loading')}</h1>
            {store && (
              <span style={isDraft ? styles.sidebarBadgeDraft : styles.sidebarBadgePublished}>
                {isDraft ? t('ownerEdit.statusDraft') : t('ownerEdit.statusPublished')}
              </span>
            )}
          </div>

          <nav style={styles.sidebarNav}>
            {tabs.map((item) => {
              const badgeText = formatBadgeCount(item.badge ?? 0);
              return (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    ...styles.navItem,
                    ...(tab === item.id ? styles.navItemActive : {}),
                  }}
                  onClick={() => setTab(item.id)}
                >
                  <span style={styles.navLabel}>{item.label}</span>
                  {badgeText ? <span style={styles.navBadge}>{badgeText}</span> : null}
                </button>
              );
            })}
          </nav>

          <div style={styles.sidebarFooter}>
            <button style={styles.sidebarGhostBtn} type="button" onClick={() => navigate('/home')}>
              {t('ownerEdit.backDashboard')}
            </button>
            <button style={styles.sidebarGhostBtn} type="button" onClick={() => void handleSignOut()}>
              {t('common.logout')}
            </button>
          </div>
        </aside>

        <div style={styles.mainColumn}>
          <header style={styles.mainTopBar}>
            <h2 style={styles.mainTopTitle}>{activeTabLabel}</h2>
          </header>

          <main style={styles.main}>
          {loading && <p style={styles.hint}>{t('ownerEdit.loading')}</p>}
          {!loading && error && <p style={styles.error}>{t('ownerEdit.errorLoad')}</p>}

          {!loading && !error && tab === 'overview' && store && (
            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>{t('ownerEdit.overviewTitle')}</h2>
              <div style={styles.overviewRow}>
                <div style={styles.thumbWrap}>
                  {store.thumbnail_url ? (
                    <img src={store.thumbnail_url} alt="" style={styles.thumb} />
                  ) : (
                    <div style={styles.thumbFallback}>{store.name.charAt(0)}</div>
                  )}
                </div>
                <div style={styles.overviewMeta}>
                  <div style={styles.statusRow}>
                    <span style={styles.metaLabel}>{t('ownerEdit.statusLabel')}</span>
                    <span style={isDraft ? styles.statusBadgeDraft : styles.statusBadgePublished}>
                      {isDraft ? t('ownerEdit.statusDraft') : t('ownerEdit.statusPublished')}
                    </span>
                  </div>
                  <p style={styles.description}>
                    {store.description?.trim() || t('ownerEdit.noDescription')}
                  </p>
                  <div style={styles.storeCodeBox}>
                    <div style={styles.metaLabel}>{t('ownerEdit.storeCodeLabel')}</div>
                    <p style={styles.storeCodeHint}>{t('ownerEdit.storeCodeHint')}</p>
                    <div style={styles.storeCodeRow}>
                      <input
                        style={styles.storeCodeInput}
                        value={storeCodeDraft}
                        onChange={(e) => setStoreCodeDraft(normalizeStoreCode(e.target.value))}
                        maxLength={12}
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        style={styles.storeCodeSaveBtn}
                        disabled={savingStoreCode || storeCodeDraft === store.store_code}
                        onClick={() => void handleSaveStoreCode()}
                      >
                        {savingStoreCode ? t('ownerEdit.storeCodeSaving') : t('ownerEdit.storeCodeSave')}
                      </button>
                    </div>
                    {storeCodeDraft && isValidStoreCode(storeCodeDraft) && (
                      <p style={styles.storeCodePreview}>
                        {t('ownerEdit.storeCodePreview', { code: storeCodeDraft, number: '1042' })}
                      </p>
                    )}
                    {storeCodeMsg && (
                      <p style={storeCodeErr ? styles.error : styles.success}>{storeCodeMsg}</p>
                    )}
                  </div>
                  <p style={styles.note}>{isDraft ? t('ownerEdit.draftNote') : t('ownerEdit.publishedNote')}</p>
                  {isDraft && (
                    <button
                      type="button"
                      style={styles.publishButton}
                      disabled={publishing}
                      onClick={handlePublish}
                    >
                      {publishing ? t('ownerEdit.publishing') : t('ownerEdit.publishButton')}
                    </button>
                  )}
                  {publishMsg && <p style={styles.success}>{publishMsg}</p>}
                  {publishErr && <p style={styles.error}>{t('ownerEdit.publishError')}</p>}
                </div>
              </div>
            </section>
          )}

          {!loading && !error && tab === 'products' && userId && storeId && (
            <OwnerProductPanel storeId={storeId} userId={userId} embedded />
          )}

          {!loading && !error && tab === 'orders' && storeId && (
            <OwnerOrdersPanel
              storeId={storeId}
              embedded
              queue="pending"
              refreshTick={refreshTick}
            />
          )}

          {!loading && !error && tab === 'fulfillment' && storeId && (
            <OwnerOrdersPanel
              storeId={storeId}
              embedded
              queue="fulfillment"
              refreshTick={refreshTick}
            />
          )}

          {!loading && !error && tab === 'layout' && storeId && (
            <OwnerDisplayPanel storeId={storeId} embedded />
          )}
          </main>
        </div>
      </div>

      <DemoToast message={toastMessage} onDismiss={dismissToast} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: oc.pageBg,
    color: oc.text,
    fontFamily: ownerFont,
    fontSize: fs.base,
  },
  shell: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: oc.sidebarBg,
    borderRight: `1px solid ${oc.sidebarBorder}`,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  sidebarBrand: {
    padding: '20px 16px 16px',
    borderBottom: `1px solid ${oc.sidebarBorder}`,
  },
  sidebarKicker: { margin: 0, fontSize: fs.xs, color: oc.sidebarText, letterSpacing: 0.5 },
  sidebarTitle: {
    margin: '6px 0 10px',
    fontSize: fs.lg,
    color: oc.sidebarTextActive,
    fontWeight: 700,
    lineHeight: 1.35,
    wordBreak: 'break-word',
  },
  sidebarBadgePublished: {
    display: 'inline-block',
    fontSize: fs.xs,
    padding: '3px 10px',
    borderRadius: 999,
    background: 'rgba(8,127,91,0.2)',
    color: '#8ce99a',
    border: '1px solid rgba(140,233,154,0.35)',
  },
  sidebarBadgeDraft: {
    display: 'inline-block',
    fontSize: fs.xs,
    padding: '3px 10px',
    borderRadius: 999,
    background: 'rgba(230,119,0,0.18)',
    color: '#ffd43b',
    border: '1px solid rgba(255,212,59,0.35)',
  },
  sidebarNav: {
    flex: 1,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflowY: 'auto',
  },
  sidebarFooter: {
    padding: '12px 10px 16px',
    borderTop: `1px solid ${oc.sidebarBorder}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sidebarGhostBtn: {
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.sidebarBorder}`,
    background: 'transparent',
    color: oc.sidebarText,
    fontSize: fs.sm,
    cursor: 'pointer',
    textAlign: 'left',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    textAlign: 'left',
    padding: '11px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: oc.sidebarText,
    fontSize: fs.base,
    cursor: 'pointer',
  },
  navItemActive: {
    background: oc.sidebarNavActiveBg,
    color: oc.sidebarTextActive,
    fontWeight: 600,
    boxShadow: `inset 3px 0 0 ${oc.sidebarNavActiveBorder}`,
  },
  navLabel: { flex: 1, minWidth: 0 },
  navBadge: {
    flexShrink: 0,
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: 999,
    background: oc.badgeRed,
    color: '#fff',
    fontSize: fs.xs,
    fontWeight: 700,
    lineHeight: '20px',
    textAlign: 'center',
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    background: oc.pageBg,
  },
  mainTopBar: {
    padding: '18px 28px',
    background: oc.surface,
    borderBottom: `1px solid ${oc.border}`,
    flexShrink: 0,
  },
  mainTopTitle: {
    margin: 0,
    fontSize: fs.xl,
    color: oc.text,
    fontWeight: 700,
  },
  main: { padding: '24px 28px', maxWidth: 1200, flex: 1, width: '100%' },
  panel: {
    background: oc.surface,
    borderRadius: 12,
    padding: 24,
    border: `1px solid ${oc.border}`,
    boxShadow: oc.shadow,
  },
  panelTitle: { margin: '0 0 16px', fontSize: fs.lg, color: oc.text, fontWeight: 600 },
  overviewRow: { display: 'flex', gap: 20, flexWrap: 'wrap' },
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
    fontSize: 40,
    fontWeight: 700,
    color: oc.textMuted,
    background: oc.surfaceMuted,
  },
  overviewMeta: { flex: 1, minWidth: 220 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  metaLabel: { color: oc.textMuted, fontSize: fs.sm },
  statusBadgePublished: {
    fontSize: fs.xs,
    padding: '4px 10px',
    borderRadius: 999,
    background: oc.successBg,
    color: oc.successText,
    border: `1px solid ${oc.successBorder}`,
  },
  statusBadgeDraft: {
    fontSize: fs.xs,
    padding: '4px 10px',
    borderRadius: 999,
    background: oc.warningBg,
    color: oc.warningText,
    border: `1px solid ${oc.warningBorder}`,
  },
  description: { color: oc.textSecondary, fontSize: fs.base, lineHeight: 1.6, margin: 0 },
  storeCodeBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    background: oc.surfaceMuted,
    border: `1px solid ${oc.border}`,
  },
  storeCodeHint: { color: oc.textMuted, fontSize: fs.sm, lineHeight: 1.45, margin: '6px 0 10px' },
  storeCodeRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  storeCodeInput: {
    flex: '1 1 120px',
    minWidth: 120,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.base,
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  storeCodeSaveBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${oc.borderStrong}`,
    background: oc.surface,
    color: oc.text,
    fontSize: fs.sm,
    fontWeight: 600,
    cursor: 'pointer',
  },
  storeCodePreview: { color: oc.orderRef, fontSize: 12, marginTop: 10, fontWeight: 600 },
  note: { color: oc.textMuted, fontSize: 13, marginTop: 16, lineHeight: 1.5 },
  publishButton: {
    marginTop: 16,
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    background: oc.primary,
    color: '#fff',
    fontSize: fs.base,
    fontWeight: 600,
    cursor: 'pointer',
  },
  success: { color: oc.successText, fontSize: 13, marginTop: 12 },
  hint: { color: oc.textMuted, fontSize: 14, lineHeight: 1.6 },
  error: { color: oc.danger, fontSize: 14 },
};
