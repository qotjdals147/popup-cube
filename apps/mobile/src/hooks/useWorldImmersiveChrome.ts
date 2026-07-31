import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setStatusBarHidden } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * 매장 WebView(월드) — 몰입 UI (AD-050).
 * Android: 하단·상단 가장자리 스와이프 시 시스템 UI 잠깐 표시 → 손 떼면 다시 숨김 (overlay-swipe).
 */
export function useWorldImmersiveChrome(active: boolean) {
  useEffect(() => {
    if (!active) return;

    setStatusBarHidden(true, 'fade');

    if (Platform.OS === 'android') {
      void (async () => {
        try {
          await NavigationBar.setPositionAsync('absolute');
          await NavigationBar.setBackgroundColorAsync('#00000000');
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch (err) {
          console.warn('[immersive] Android system UI:', err);
        }
      })();
    }

    return () => {
      setStatusBarHidden(false, 'fade');
      if (Platform.OS === 'android') {
        void (async () => {
          try {
            await NavigationBar.setVisibilityAsync('visible');
            await NavigationBar.setBehaviorAsync('inset-touch');
            await NavigationBar.setPositionAsync('relative');
          } catch {
            // ignore restore errors
          }
        })();
      }
    };
  }, [active]);
}
