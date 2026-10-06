import { useEffect } from 'react';
import { acquireOverlayScrollLock } from '../lib/overlayScrollLock';

export function useOverlayScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return acquireOverlayScrollLock();
  }, [active]);
}
