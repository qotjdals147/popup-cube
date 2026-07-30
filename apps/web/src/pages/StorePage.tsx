import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import {
  mountTopDownGame,
  type GameChatMessage,
  type GeneratedInteractZone,
  type TopDownGameController,
  type VirtualDirections,
} from '@popup-cube/game-core';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useViewMode } from '../context/ViewModeContext';
import { ShopPanel } from '../components/ShopPanel';
import { CartDrawer } from '../components/CartDrawer';
import { DisplayProductModal } from '../components/DisplayProductModal';
import { OwnerProductPanel } from '../components/OwnerProductPanel';
import { OwnerOrdersPanel } from '../components/OwnerOrdersPanel';
import { DemoToast } from '../components/DemoToast';
import { VirtualDpad } from '../components/VirtualDpad';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { getStoreSummary } from '../lib/stores';
import { t, getRoleLabel } from '../i18n';
import { DEMO_STORE_ID } from '@popup-cube/shared';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10분간 움직임/채팅 없으면 자동 퇴장
const IDLE_WARNING_MS = 30 * 1000; // 퇴장 30초 전부터 경고 배너 표시
const IDLE_CHECK_INTERVAL_MS = 1000;

/** Vercel 등 배포 URL에서 localhost 소켓은 CEO PC의 localhost를 가리켜 영원히 접속 중에 걸린다. */
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

export function StorePage() {
  const { storeId } = useParams();
  const {
    role,
    userId,
    email,
    nickname,
    loading: authLoading,
    storeId: myStoreId,
    signOut,
  } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useViewMode();
  const { totalQuantity } = useCart();
  const worldRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<TopDownGameController | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const chatOpenRef = useRef(false);

  const isOwnerOfThisStore = role === 'owner' && myStoreId === storeId;
  // 닉네임이 있으면 우선 사용 (구버전 계정은 nickname이 없어서 email 앞부분으로 대체).
  const username = useMemo(
    () => nickname ?? email?.split('@')[0] ?? t('common.guest'),
    [nickname, email]
  );
  const serverUrl = (import.meta.env.VITE_SOCKET_SERVER_URL as string) || 'http://localhost:3000';

  const [worldStatus, setWorldStatus] = useState(t('store.world.status.preparing'));
  const [worldError, setWorldError] = useState<string | null>(null);
  const [channelText, setChannelText] = useState<string>('');
  const [messages, setMessages] = useState<GameChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState<number | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [ownerProductsOpen, setOwnerProductsOpen] = useState(false);
  const [ownerOrdersOpen, setOwnerOrdersOpen] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nearInteractZone, setNearInteractZone] = useState<GeneratedInteractZone | null>(null);
  const [displayModalOpen, setDisplayModalOpen] = useState(false);
  const [gameReady, setGameReady] = useState(false);

  function showComingSoon() {
    markActivity();
    setToastMessage(t('common.comingSoon'));
  }

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    getStoreSummary(storeId)
      .then((summary) => {
        if (active) setStoreName(summary?.name ?? null);
      })
      .catch(() => {
        if (active) setStoreName(null);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  function markActivity() {
    lastActivityRef.current = Date.now();
    setIdleSecondsLeft(null);
  }

  /** AD-037 — 웹 플레이 월드 비활성: 점주→에디터, 그 외→앱 안내 */
  useEffect(() => {
    if (authLoading || !storeId) return;
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }
    if (isOwnerOfThisStore) {
      navigate(`/store/${storeId}/edit`, { replace: true });
      return;
    }
    navigate('/app-only', { replace: true });
  }, [authLoading, userId, storeId, isOwnerOfThisStore, navigate]);

  useEffect(() => {
    if (!storeId || !userId || !worldRef.current) return;

    let mounted = true;
    setWorldError(null);
    setMessages([]);
    setGameReady(false);
    markActivity();

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
      onSocketCreated(socket) {
        // 아직 입장(join)이 끝나기 전이라도 cleanup에서 바로 끊을 수 있도록 즉시 저장.
        // (React StrictMode 개발 모드에서 effect가 두 번 실행되며 생기는 "유령 접속" 방지 — ISS-019)
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
      onChatMessage(message) {
        if (!mounted) return;
        setMessages((prev) => [...prev.slice(-24), message]);
      },
      onPlayerMove() {
        if (mounted) markActivity();
      },
      onNearInteractZone(zone) {
        if (mounted) setNearInteractZone(zone);
      },
      mobileLayout: isMobile,
    })
      .then((controller) => {
        if (!mounted) {
          controller.destroy();
          return;
        }
        gameRef.current = controller;
        setGameReady(true);
        // 게임 로딩이 끝나기 전에 채팅을 이미 열어놨을 수도 있으니 현재 상태로 맞춰준다.
        controller.setMovementEnabled(!chatOpenRef.current);
      })
      .catch((err) => {
        if (!mounted) return;
        // 'cancelled'는 이미 정리된 뒤 도착한 응답 — 사용자에게 에러로 보여줄 필요 없음.
        if (err instanceof Error && err.message === 'cancelled') return;
        setWorldError(err instanceof Error ? err.message : t('store.world.errorLoad'));
      });

    return () => {
      mounted = false;
      setGameReady(false);
      // gameRef보다 먼저 socketRef를 끊어서, 아직 입장이 끝나지 않은 소켓도
      // 서버에 join 요청이 도달하기 전에 확실히 정리한다. (ISS-019)
      socketRef.current?.disconnect();
      socketRef.current = null;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [storeId, userId, username, serverUrl, isMobile]);

  useEffect(() => {
    if (!isMobile || !worldRef.current) return;
    const el = worldRef.current;
    const ro = new ResizeObserver(() => {
      gameRef.current?.resize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile, gameReady]);

  useEffect(() => {
    if (!isMobile) return;
    const refresh = () => window.setTimeout(() => gameRef.current?.resize(), 150);
    window.addEventListener('orientationchange', refresh);
    window.visualViewport?.addEventListener('resize', refresh);
    return () => {
      window.removeEventListener('orientationchange', refresh);
      window.visualViewport?.removeEventListener('resize', refresh);
    };
  }, [isMobile, gameReady]);

  async function handleSignOut() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    gameRef.current?.destroy();
    gameRef.current = null;
    await signOut();
    navigate('/');
  }

  // 잠수(자리비움) 감지: 움직임·채팅이 10분간 없으면 자동으로 홈으로 나가짐 (30초 전 경고 표시).
  // 점주는 "본인 매장"에서는 면제 (다른 사람 매장을 둘러볼 때는 일반 유저와 동일하게 적용).
  useEffect(() => {
    if (!storeId || !userId || isOwnerOfThisStore) {
      setIdleSecondsLeft(null);
      return;
    }

    const interval = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const remainingMs = IDLE_TIMEOUT_MS - idleMs;

      if (remainingMs <= 0) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        gameRef.current?.destroy();
        gameRef.current = null;
        navigate('/home', { state: { idleKicked: true } });
        return;
      }

      setIdleSecondsLeft(remainingMs <= IDLE_WARNING_MS ? Math.ceil(remainingMs / 1000) : null);
    }, IDLE_CHECK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [storeId, userId, isOwnerOfThisStore, navigate]);

  useEffect(() => {
    if (!chatOpen) return;
    chatInputRef.current?.focus();
  }, [chatOpen]);

  // 채팅 입력창이 열려 있는 동안은 캐릭터 이동을 멈춤 (방향키를 눌러도 게임이 반응하지 않게).
  useEffect(() => {
    chatOpenRef.current = chatOpen;
    gameRef.current?.setMovementEnabled(!chatOpen);
  }, [chatOpen]);

  useEffect(() => {
    function onGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const isTypingTarget =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable === true;
        if (!chatOpen && !isTypingTarget) {
          e.preventDefault();
          setChatOpen(true);
        }
      }

      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false);
        // 입력하던 내용은 버림 — 다음에 다시 열었을 때 이전 내용이 남아있지 않게.
        setChatInput('');
      }
    }

    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [chatOpen]);

  function handleSendChatAndClose() {
    const text = chatInput.trim();
    if (!text) {
      // 내용이 비어있는 채로 다시 Enter를 치면 Esc와 똑같이 그냥 닫기만 한다.
      setChatOpen(false);
      setChatInput('');
      return;
    }
    gameRef.current?.sendChat(text);
    setChatInput('');
    setChatOpen(false);
    markActivity();
  }

  const handleVirtualDirections = useCallback((dirs: VirtualDirections) => {
    gameRef.current?.setVirtualDirections(dirs);
    if (dirs.up || dirs.down || dirs.left || dirs.right) {
      markActivity();
    }
  }, []);

  const isGucciDemo = storeId === DEMO_STORE_ID;

  const hudButtons = (
    <>
      <button
        style={
          isMobile
            ? undefined
            : {
                ...styles.hudButton,
                ...(nearInteractZone ? styles.hudButtonActive : {}),
                ...(!nearInteractZone ? styles.hudButtonDisabled : {}),
              }
        }
        className={
          isMobile
            ? `hud-btn-interact${nearInteractZone ? ' hud-btn-active' : ' hud-btn-disabled'}`
            : undefined
        }
        disabled={!nearInteractZone}
        onClick={() => {
          if (!nearInteractZone) return;
          markActivity();
          setDisplayModalOpen(true);
        }}
        title={
          nearInteractZone
            ? t('display.interactNear', { label: nearInteractZone.label })
            : t('display.interactHint')
        }
      >
        {nearInteractZone ? t('display.interactNear') : t('store.hud.interact')}
      </button>
      <button
        style={isMobile ? undefined : styles.hudButton}
        className={isMobile ? 'hud-btn-chat' : undefined}
        onClick={() => {
          markActivity();
          setChatOpen(true);
        }}
      >
        {t('store.hud.chat')}
      </button>
      <button
        style={isMobile ? undefined : styles.hudButton}
        className={isMobile ? 'hud-btn-cart' : undefined}
        onClick={() => {
          markActivity();
          setCartOpen(true);
        }}
        title="담아 둔 상품 · 결제"
      >
        🛒 {t('store.hud.cart')}
        {totalQuantity > 0 ? ` (${totalQuantity})` : ''}
      </button>
      <button
        style={isMobile ? undefined : styles.shopButton}
        className={isMobile ? 'hud-btn-shop' : undefined}
        onClick={() => {
          markActivity();
          setShopOpen(true);
        }}
        title="매장 전체 상품 목록 (장바구니와 다름)"
      >
        {t('store.hud.allProducts')}
      </button>
    </>
  );

  const chatSection = (
    <section
      style={isMobile ? undefined : styles.chatPanel}
      className={
        isMobile
          ? `chat-panel-mobile${chatOpen ? ' chat-open-mobile' : ''}`
          : undefined
      }
    >
      {!isMobile && (
        <>
          <div style={styles.chatTitle}>{t('store.chat.title')}</div>
          <div style={styles.chatMessages}>
            {messages.length === 0 ? (
              <div style={styles.chatEmpty}>{t('store.chat.empty')}</div>
            ) : (
              messages.map((message, idx) => (
                <div key={`${message.userId}-${message.timestamp}-${idx}`} style={styles.chatLine}>
                  <span style={styles.chatTime}>[{formatChatTime(message.timestamp)}]</span>{' '}
                  <strong>{message.username}</strong>: {message.message}
                </div>
              ))
            )}
          </div>
          {!chatOpen && (
            <button style={styles.chatOpenButton} onClick={() => setChatOpen(true)}>
              {t('store.chat.openHint')}
            </button>
          )}
        </>
      )}
      {chatOpen && (
        <div
          style={isMobile ? undefined : styles.chatInputRow}
          className={isMobile ? 'chat-input-mobile' : undefined}
        >
          {isMobile && <div className="chat-mobile-title">{t('store.chat.title')}</div>}
          <input
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendChatAndClose();
              }
            }}
            placeholder={t('store.chat.placeholder')}
            style={isMobile ? undefined : styles.chatInput}
            className={isMobile ? 'chat-input-field-mobile' : undefined}
            maxLength={500}
          />
          <button
            style={isMobile ? undefined : styles.chatSendButton}
            className={isMobile ? 'chat-send-mobile' : undefined}
            onClick={handleSendChatAndClose}
          >
            {t('store.chat.send')}
          </button>
        </div>
      )}
    </section>
  );

  const storeModals = (
    <>
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
      {cartOpen && storeId && (
        <CartDrawer storeId={storeId} userId={userId} onClose={() => setCartOpen(false)} />
      )}
      {displayModalOpen && storeId && nearInteractZone && (
        <DisplayProductModal
          storeId={storeId}
          fixtureLabel={nearInteractZone.label}
          fixtureId={
            nearInteractZone.id === 'fixture_center_table'
              ? undefined
              : nearInteractZone.id
          }
          onClose={() => setDisplayModalOpen(false)}
          onOpenCart={() => {
            setDisplayModalOpen(false);
            setCartOpen(true);
          }}
        />
      )}
      {ownerProductsOpen && storeId && userId && (
        <OwnerProductPanel storeId={storeId} userId={userId} onClose={() => setOwnerProductsOpen(false)} />
      )}
      {ownerOrdersOpen && storeId && (
        <OwnerOrdersPanel storeId={storeId} onClose={() => setOwnerOrdersOpen(false)} />
      )}
      <DemoToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );

  if (isMobile) {
    return (
      <div className="store-page-mobile store-immersive page-mobile">
        {idleSecondsLeft !== null && (
          <div className="mobile-toast-idle">
            {t('store.world.idleWarning', { seconds: idleSecondsLeft })}
          </div>
        )}
        <div className="world-stage-mobile">
          <div ref={worldRef} className="world-canvas-mobile">
            {worldError ? (
              <div style={styles.worldPlaceholder}>{t('store.gamePlaceholder')}</div>
            ) : null}
          </div>
          {!worldError && (
            <div className="mobile-game-chrome">
              <header className="mobile-overlay-header">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => navigate('/home')}
                  aria-label={t('store.backToHome')}
                >
                  ←
                </button>
                <span className="store-title-mobile">{storeName ?? storeId}</span>
                <ViewModeToggle compact />
              </header>
              <div className="world-overlay-status">
                <span>{worldStatus}</span>
                {!!channelText && (
                  <span className="channel-badge-mobile">{channelText}</span>
                )}
              </div>
              <VirtualDpad
                onDirectionChange={handleVirtualDirections}
                disabled={chatOpen || !gameReady}
              />
              <footer className="hud-overlay-mobile">{hudButtons}</footer>
            </div>
          )}
          {worldError && (
            <div className="mobile-offline-overlay">
              <p style={styles.offlineTitle}>{t('store.world.offlineHint')}</p>
              <ViewModeToggle compact />
            </div>
          )}
        </div>
        {chatSection}
        {storeModals}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.homeButton} onClick={() => navigate('/home')}>
            {t('store.backToHome')}
          </button>
          <span>
            <strong>{storeName ?? storeId}</strong> — {username} ({getRoleLabel(role)})
          </span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.cartHeaderButton} onClick={() => setCartOpen(true)}>
            🛒 {totalQuantity > 0 ? totalQuantity : ''}
          </button>
          <button style={styles.cartHeaderButton} onClick={() => navigate('/mypage')}>
            {t('common.myPage')}
          </button>
          <button style={styles.signOutButton} onClick={handleSignOut}>
            {t('common.logout')}
          </button>
        </div>
      </header>

      <main style={styles.gameArea}>
        <div style={styles.worldStatusRow}>
          <span>{worldStatus}</span>
          {!!channelText && <span style={styles.channelBadge}>{channelText}</span>}
        </div>
        {worldError ? (
          <div style={styles.worldOfflineBanner}>
            <p style={styles.offlineTitle}>{t('store.world.offlineHint')}</p>
            <p style={styles.offlineHint}>{t('store.world.demoShopHint')}</p>
          </div>
        ) : null}
        {idleSecondsLeft !== null && (
          <p style={styles.idleWarning}>{t('store.world.idleWarning', { seconds: idleSecondsLeft })}</p>
        )}
        <div
          ref={worldRef}
          style={
            isGucciDemo
              ? { ...styles.worldCanvas, ...styles.worldCanvasGucci }
              : styles.worldCanvas
          }
        >
          {worldError ? <div style={styles.worldPlaceholder}>{t('store.gamePlaceholder')}</div> : null}
        </div>
      </main>

      <footer style={styles.hud}>{hudButtons}</footer>

      {chatSection}

      {isOwnerOfThisStore && (
        <div style={styles.ownerToolbar}>
          <span style={styles.ownerLabel}>{t('store.owner.label')}</span>
          <button style={styles.ownerButton} onClick={showComingSoon}>
            {t('store.owner.editStore')}
          </button>
          <button style={styles.ownerButton} onClick={() => setOwnerProductsOpen(true)}>
            {t('store.owner.upload')}
          </button>
          <button style={styles.ownerButton} onClick={showComingSoon}>
            {t('store.owner.pixel')}
          </button>
          <button style={styles.ownerButton} onClick={() => setOwnerOrdersOpen(true)}>
            {t('store.owner.orders')}
          </button>
        </div>
      )}

      {storeModals}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#0f3460',
    fontSize: 13,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  cartHeaderButton: {
    background: 'transparent',
    border: '1px solid #2c4270',
    color: '#fff',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 13,
  },
  homeButton: {
    background: 'transparent',
    border: '1px solid #2c4270',
    color: '#fff',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 12,
  },
  signOutButton: {
    background: 'transparent',
    border: '1px solid #a0a0c0',
    color: '#a0a0c0',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 12,
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '12px 20px',
  },
  worldStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#a5b6d8',
    fontSize: 13,
  },
  channelBadge: {
    border: '1px solid #395480',
    borderRadius: 999,
    padding: '2px 10px',
    color: '#d8e4ff',
  },
  errorText: { color: '#ff8686', margin: 0, fontSize: 13 },
  worldOfflineBanner: {
    background: '#1e2a45',
    border: '1px solid #395480',
    borderRadius: 8,
    padding: '10px 12px',
  },
  offlineTitle: { margin: 0, fontSize: 13, color: '#d8e4ff' },
  offlineHint: { margin: '6px 0 0', fontSize: 12, color: '#a0a0c0' },
  idleWarning: {
    color: '#ffd580',
    background: '#3a2f10',
    border: '1px solid #6b5320',
    borderRadius: 8,
    padding: '6px 10px',
    margin: 0,
    fontSize: 12,
  },
  worldCanvas: {
    position: 'relative',
    width: '100%',
    height: 'clamp(380px, 62vh, 640px)',
    border: '1px solid #273a63',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#0d1730',
  },
  worldCanvasGucci: {
    border: '2px solid #c9a962',
    boxShadow: '0 0 24px rgba(201, 169, 98, 0.15), inset 0 0 40px rgba(0,0,0,0.35)',
    background: '#0b1020',
    height: 'clamp(420px, 68vh, 720px)',
  },
  worldPlaceholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(17, 22, 41, 0.88)',
    color: '#a0a0c0',
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
    zIndex: 2,
    pointerEvents: 'none',
  },
  hud: {
    display: 'flex',
    gap: 8,
    padding: '12px 20px',
    background: '#0f3460',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  hudButton: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #2c4270',
    background: '#16213e',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
  hudButtonActive: {
    borderColor: '#c9a962',
    background: '#1f2840',
    boxShadow: '0 0 0 1px #c9a96244',
  },
  hudButtonDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  shopButton: {
    marginLeft: 'auto',
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#e94560',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  chatPanel: {
    borderTop: '1px solid #1c2f54',
    background: '#101d36',
    padding: '10px 20px 12px',
  },
  chatTitle: { fontSize: 12, color: '#9db2df', marginBottom: 8 },
  chatMessages: {
    height: 120,
    overflowY: 'auto',
    border: '1px solid #2b456f',
    borderRadius: 8,
    padding: '8px 10px',
    background: '#0d1730',
    fontSize: 13,
  },
  chatEmpty: { color: '#6f85b5', fontSize: 12 },
  chatLine: { marginBottom: 4 },
  chatTime: {
    color: '#8ca4d8',
    fontSize: 12,
  },
  chatInputRow: {
    marginTop: 8,
    display: 'flex',
    gap: 8,
  },
  chatOpenButton: {
    marginTop: 8,
    width: '100%',
    borderRadius: 8,
    border: '1px dashed #4062a0',
    background: '#13284d',
    color: '#d8e6ff',
    padding: '8px 10px',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left',
  },
  chatInput: {
    flex: 1,
    borderRadius: 8,
    border: '1px solid #2b456f',
    background: '#0d1730',
    color: '#fff',
    padding: '8px 10px',
    fontSize: 13,
  },
  chatSendButton: {
    borderRadius: 8,
    border: '1px solid #4062a0',
    background: '#203c70',
    color: '#fff',
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
  },
  ownerToolbar: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '10px 20px',
    background: '#533483',
    flexWrap: 'wrap',
  },
  ownerLabel: { fontSize: 12, opacity: 0.8, marginRight: 8 },
  ownerButton: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
};

function formatChatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
