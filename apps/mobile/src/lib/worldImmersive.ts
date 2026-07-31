import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { setStatusBarHidden } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

/** 매장 WebView — 몰입(상·하단 시스템 UI 숨김). Android overlay-swipe = 게임식 엣지 스와이프. */
export async function applyWorldImmersiveChrome(): Promise<void> {
  setStatusBarHidden(true, 'none');
  RNStatusBar.setHidden(true, 'none');
  if (Platform.OS === 'android') {
    RNStatusBar.setTranslucent(true);
    RNStatusBar.setBackgroundColor('transparent');
  }

  try {
    await SystemUI.setBackgroundColorAsync('#00000000');
  } catch {
    // ignore
  }

  if (Platform.OS !== 'android') return;

  try {
    await NavigationBar.setPositionAsync('absolute');
    await NavigationBar.setBackgroundColorAsync('#00000000');
    await NavigationBar.setBehaviorAsync('overlay-swipe');
    await NavigationBar.setVisibilityAsync('hidden');
  } catch (err) {
    console.warn('[immersive] apply failed:', err);
  }
}

/** 홈·로그인 등 — 시스템 UI 복원 */
export async function restoreSystemChrome(): Promise<void> {
  setStatusBarHidden(false, 'fade');
  RNStatusBar.setHidden(false, 'fade');

  if (Platform.OS !== 'android') return;

  try {
    await NavigationBar.setVisibilityAsync('visible');
    await NavigationBar.setBehaviorAsync('inset-touch');
    await NavigationBar.setPositionAsync('relative');
  } catch {
    // ignore
  }
}
