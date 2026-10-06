import { postToApp } from './appBridge';

let lockCount = 0;

interface SavedScrollStyles {
  htmlOverflow: string;
  bodyOverflow: string;
  bodyTouchAction: string;
  bodyPosition: string;
  bodyTop: string;
  bodyWidth: string;
  scrollY: number;
  roots: { el: HTMLElement; overflow: string; touchAction: string }[];
}

let saved: SavedScrollStyles | null = null;

const SCROLL_ROOT_SELECTORS = '.store-shop-page, .cart-view--page, .play-world-page, .shopper-account-page';

function lockScrollRoots() {
  const roots: SavedScrollStyles['roots'] = [];
  document.querySelectorAll(SCROLL_ROOT_SELECTORS).forEach((node) => {
    const el = node as HTMLElement;
    roots.push({ el, overflow: el.style.overflow, touchAction: el.style.touchAction });
    el.style.overflow = 'hidden';
    el.style.touchAction = 'none';
  });
  return roots;
}

function applyLock() {
  if (lockCount !== 1) return;

  const html = document.documentElement;
  const body = document.body;
  const scrollY = window.scrollY;

  saved = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyTouchAction: body.style.touchAction,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyWidth: body.style.width,
    scrollY,
    roots: lockScrollRoots(),
  };

  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  body.style.touchAction = 'none';
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';

  postToApp('webview_scroll_lock', { locked: true });
}

function releaseLock() {
  if (lockCount !== 0 || !saved) return;

  const html = document.documentElement;
  const body = document.body;
  const { scrollY } = saved;

  html.style.overflow = saved.htmlOverflow;
  body.style.overflow = saved.bodyOverflow;
  body.style.touchAction = saved.bodyTouchAction;
  body.style.position = saved.bodyPosition;
  body.style.top = saved.bodyTop;
  body.style.width = saved.bodyWidth;

  for (const { el, overflow, touchAction } of saved.roots) {
    el.style.overflow = overflow;
    el.style.touchAction = touchAction;
  }

  saved = null;
  window.scrollTo(0, scrollY);

  postToApp('webview_scroll_lock', { locked: false });
}

/** 중첩 모달 — ref-count · html/body + 쇼핑 페이지 루트 · 앱 WebView scroll (ISS-058) */
export function acquireOverlayScrollLock(): () => void {
  lockCount += 1;
  applyLock();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    releaseLock();
  };
}
