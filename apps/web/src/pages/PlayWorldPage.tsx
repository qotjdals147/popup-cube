import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import {
  mountTopDownGame,
  type FixturePlacement,
  type GeneratedInteractZone,
  type TopDownGameController,
  type VirtualDirections,
} from '@popup-cube/game-core';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { VirtualDpad } from '../components/VirtualDpad';
import { DisplayProductModal } from '../components/DisplayProductModal';
import { CartDrawer } from '../components/CartDrawer';
import { ShopPanel } from '../components/ShopPanel';
import { toFixturePlacement, loadStoreDisplayLayout } from '../lib/displayFixtures';
import { getStoreSummary } from '../lib/stores';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

function isLocalhostServerUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }
}

function isBrowserOnLocalDev(): boolean {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** 앱 WebView가 넘긴 Supabase 세션을 해시에서 읽어 복구 */
async function bootstrapSessionFromHash(): Promise<void> {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return;
  const params = new URLSearchParams(raw);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return;

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    console.error('[play] setSession failed:', error.message);
    return;
  }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function postToApp(type: string, payload?: Record<string, unknown>) {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type, ...payload }));
}

/** GUCCI generated 존 id → DB fixture UUID 매핑 (Sprint 4-2) */
function resolveFixtureId(
  zone: GeneratedInteractZone | null,
  placements: FixturePlacement[]
): string | null {
  if (!zone || placements.length === 0) return null;
  if (placements.some((p) => p.id === zone.id)) return zone.id;
  if (zone.id === 'fixture_center_table' || zone.id.startsWith('fixture_')) {
    return placements[0]?.id ?? null;
  }
  return placements[0]?.id ?? null;
}

/**
 * 모바일 앱 WebView 전용 플레이 월드 (AD-037 · Sprint 4-2).
 * 진열 상호작용 → 상품 팝업 · 장바구니 · 착용 미리보기.
 */
export function PlayWorldPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { userId, email, nickname, loading: authLoading } = useAuth();
  const { totalQuantity } = useCart();
  const worldRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<TopDownGameController | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const username = useMemo(
    () => nickname ?? email?.split('@')[0] ?? t('common.guest'),
    [nickname, email]
  );
  const serverUrl = (import.meta.env.VITE_SOCKET_SERVER_URL as string) || 'http://localhost:3000';

  const [bootstrapping, setBootstrapping] = useState(true);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [worldStatus, setWorldStatus] = useState(t('store.world.status.preparing'));
  const [worldError, setWorldError] = useState<string | null>(null);
  const [channelText, setChannelText] = useState('');
  const [fixtureCount, setFixtureCount] = useState(0);
  const [nearZone, setNearZone] = useState<GeneratedInteractZone | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [placements, setPlacements] = useState<FixturePlacement[]>([]);
  const [occupancy, setOccupancy] = useState<
    Awaited<ReturnType<typeof loadStoreDisplayLayout>>['occupancy'] | undefined
  >(undefined);
  const [layoutReady, setLayoutReady] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  const activeFixtureId = useMemo(
    () => resolveFixtureId(nearZone, placements),
    [nearZone, placements]
  );

  useEffect(() => {
    let active = true;
    bootstrapSessionFromHash().finally(() => {
      if (active) setBootstrapping(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (bootstrapping || authLoading) return;
    if (userId) {
      setWorldError(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setWorldError(t('play.needLogin'));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [bootstrapping, authLoading, userId]);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    getStoreSummary(storeId)
      .then((s) => {
        if (active) setStoreName(s?.name ?? null);
      })
      .catch(() => {
        if (active) setStoreName(null);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  useEffect(() => {
    if (!storeId || !userId) return;
    let active = true;
    setLayoutReady(false);
    loadStoreDisplayLayout(storeId)
      .then((layout) => {
        if (!active) return;
        setPlacements(layout.fixtures.map(toFixturePlacement));
        setOccupancy(layout.occupancy);
        setFixtureCount(layout.fixtures.length);
        setLayoutReady(true);
      })
      .catch((err) => {
        console.error('[play] display layout load failed:', err);
        if (!active) return;
        setPlacements([]);
        setOccupancy(undefined);
        setFixtureCount(0);
        setLayoutReady(true);
      });
    return () => {
      active = false;
    };
  }, [storeId, userId]);

  useEffect(() => {
    if (!storeId || !userId || !worldRef.current || !layoutReady) return;

    let mounted = true;
    setWorldError(null);
    setGameReady(false);

    if (!serverUrl || (isLocalhostServerUrl(serverUrl) && !isBrowserOnLocalDev())) {
      setWorldStatus('');
      setWorldError(t('store.world.offlineHint'));
      return;
    }

    setWorldStatus(t('store.world.status.connecting'));

    mountTopDownGame({
      container: worldRef.current,
      serverUrl,
      storeId,
      userId,
      username,
      mobileLayout: true,
      displayFixtures: placements,
      occupancy,
      onSocketCreated(socket) {
        socketRef.current = socket;
      },
      onStatusChange(text) {
        if (mounted) setWorldStatus(text);
      },
      onError(text) {
        if (mounted) setWorldError(text);
      },
      onChannelChange(channel) {
        if (!mounted) return;
        setChannelText(
          `${t('store.world.channelPrefix')} ${channel.number} · ${channel.visitorCount}/${channel.maxCapacity}${t('store.world.peopleSuffix')}`
        );
      },
      onNearInteractZone(zone) {
        if (mounted) {
          setNearZone(zone);
          if (!zone) setDisplayOpen(false);
        }
      },
    })
      .then((controller) => {
        if (!mounted) {
          controller.destroy();
          return;
        }
        gameRef.current = controller;
        setGameReady(true);
        postToApp('world_ready', { storeId, fixtureCount: placements.length });
      })
      .catch((err) => {
        if (!mounted) return;
        if (err instanceof Error && err.message === 'cancelled') return;
        setWorldError(err instanceof Error ? err.message : t('store.world.errorLoad'));
      });

    return () => {
      mounted = false;
      setGameReady(false);
      socketRef.current?.disconnect();
      socketRef.current = null;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [storeId, userId, username, serverUrl, layoutReady, placements, occupancy]);

  useEffect(() => {
    if (!worldRef.current || !gameReady) return;
    const el = worldRef.current;
    const ro = new ResizeObserver(() => gameRef.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [gameReady]);

  const onDpad = useCallback((dirs: VirtualDirections) => {
    gameRef.current?.setVirtualDirections(dirs);
  }, []);

  function goHome() {
    postToApp('navigate_home');
    if (!window.ReactNativeWebView) {
      navigate('/app-only');
    }
  }

  function openDisplay() {
    if (!nearZone) return;
    setDisplayOpen(true);
  }

  if (bootstrapping || authLoading) {
    return (
      <div style={styles.root}>
        <p style={styles.status}>{t('store.world.status.preparing')}</p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <button type="button" style={styles.backBtn} onClick={goHome}>
          {t('play.backHome')}
        </button>
        <div style={styles.headerText}>
          <div style={styles.title}>{storeName ?? storeId}</div>
          <div style={styles.meta}>
            {channelText || worldStatus}
            {fixtureCount > 0 ? ` · ${t('play.fixtureCount', { count: fixtureCount })}` : ''}
          </div>
        </div>
      </header>

      {worldError && <div style={styles.error}>{worldError}</div>}

      <div ref={worldRef} style={styles.world} />

      {nearZone && !displayOpen && (
        <button type="button" style={styles.interactBanner} onClick={openDisplay}>
          <span>{nearZone.label}</span>
          <span style={styles.interactHint}>{t('play.interactTap')}</span>
        </button>
      )}

      {/* 이동 D-pad — 왼쪽 아래 (항상 보이게 · embedded 인라인) */}
      <div style={styles.dpadWrap}>
        <VirtualDpad embedded onDirectionChange={onDpad} disabled={!gameReady} />
        {!gameReady && (
          <div style={styles.dpadHint}>{t('play.moveWhenReady')}</div>
        )}
      </div>

      {gameReady && (
        <div style={styles.hud}>
          <button
            type="button"
            style={{
              ...styles.hudBtn,
              ...(nearZone ? styles.hudBtnActive : styles.hudBtnDisabled),
            }}
            disabled={!nearZone}
            onClick={openDisplay}
          >
            {nearZone ? t('display.interactNear') : t('store.hud.interact')}
          </button>
          <button type="button" style={styles.hudBtn} onClick={() => setCartOpen(true)}>
            🛒 {t('store.hud.cart')}
            {totalQuantity > 0 ? ` (${totalQuantity})` : ''}
          </button>
          <button type="button" style={styles.hudBtn} onClick={() => setShopOpen(true)}>
            {t('store.hud.allProducts')}
          </button>
        </div>
      )}

      {displayOpen && storeId && nearZone && (
        <DisplayProductModal
          storeId={storeId}
          fixtureLabel={nearZone.label}
          fixtureId={activeFixtureId}
          onClose={() => setDisplayOpen(false)}
          onOpenCart={() => {
            setDisplayOpen(false);
            setCartOpen(true);
          }}
        />
      )}

      {cartOpen && storeId && (
        <CartDrawer
          storeId={storeId}
          userId={userId}
          onClose={() => setCartOpen(false)}
        />
      )}

      {shopOpen && storeId && (
        <ShopPanel
          storeId={storeId}
          onClose={() => setShopOpen(false)}
          onOpenCart={() => {
            setShopOpen(false);
            setCartOpen(true);
          }}
        />
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0e1a',
    color: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: 'rgba(10,14,26,0.92)',
    borderBottom: '1px solid #1e293b',
    zIndex: 2,
  },
  backBtn: {
    border: 'none',
    background: '#1e293b',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    fontWeight: 600,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 16,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  status: { margin: 'auto', color: '#94a3b8' },
  error: {
    margin: '8px 12px',
    padding: '10px 12px',
    background: '#3f1d1d',
    color: '#fecaca',
    borderRadius: 8,
    fontSize: 13,
  },
  world: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  interactBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 210,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    padding: '12px 14px',
    background: 'rgba(15,23,42,0.94)',
    border: '1px solid #c9a962',
    borderRadius: 12,
    zIndex: 4,
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
  },
  interactHint: { fontSize: 12, color: '#c9a962', fontWeight: 600 },
  hud: {
    position: 'absolute',
    right: 8,
    bottom: 16,
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxWidth: '42%',
  },
  hudBtn: {
    border: '1px solid #334155',
    background: 'rgba(15,23,42,0.92)',
    color: '#f1f5f9',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'left',
  },
  hudBtnActive: {
    borderColor: '#c9a962',
    color: '#c9a962',
  },
  hudBtnDisabled: {
    opacity: 0.45,
  },
  dpadWrap: {
    position: 'absolute',
    left: 10,
    bottom: 20,
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  dpadHint: {
    fontSize: 11,
    color: '#94a3b8',
    background: 'rgba(15,23,42,0.85)',
    padding: '4px 8px',
    borderRadius: 6,
  },
};
