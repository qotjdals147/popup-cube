import { useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  applyWorldImmersiveChrome,
  restoreSystemChrome,
} from '../lib/worldImmersive';

/** 매장 WebView(월드) — 몰입 UI (AD-050). 포커스·WebView 로드 시 재적용. */
export function useWorldImmersiveChrome(active: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!active) return undefined;

      void applyWorldImmersiveChrome();
      const retries = [200, 400, 1200, 2500, 5000].map((ms) =>
        setTimeout(() => void applyWorldImmersiveChrome(), ms)
      );

      const poll = setInterval(() => {
        void applyWorldImmersiveChrome();
      }, 3000);

      const onAppState = (state: AppStateStatus) => {
        if (state === 'active') void applyWorldImmersiveChrome();
      };
      const appSub = AppState.addEventListener('change', onAppState);

      return () => {
        retries.forEach(clearTimeout);
        clearInterval(poll);
        appSub.remove();
        void restoreSystemChrome();
      };
    }, [active])
  );
}

/** 홈·로그인 — 시스템 UI 복원 (Expo Go immersive 잔여 방지) */
export function useRestoreSystemChromeOnFocus() {
  useFocusEffect(
    useCallback(() => {
      void restoreSystemChrome();
    }, [])
  );
}
