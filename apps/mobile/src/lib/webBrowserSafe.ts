import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { WebBrowserResult } from 'expo-web-browser';

function isPromise(value: unknown): value is Promise<unknown> {
  return value != null && typeof (value as Promise<unknown>).then === 'function';
}

async function awaitOptional(value: unknown): Promise<void> {
  if (isPromise(value)) {
    await value;
  }
}

export async function dismissBrowserSafe(): Promise<void> {
  try {
    await awaitOptional(WebBrowser.dismissBrowser?.());
  } catch {
    // Expo Go — no-op
  }
}

export async function openBrowserSafe(
  url: string,
  options?: Parameters<typeof WebBrowser.openBrowserAsync>[1],
): Promise<WebBrowserResult | null> {
  try {
    const opened = WebBrowser.openBrowserAsync(url, options);
    if (!isPromise(opened)) return null;
    return (await opened) as WebBrowserResult;
  } catch {
    return null;
  }
}

/**
 * Android: Custom Tab이 Gmail/메일 작성으로 빠지는 ISS-040 회피
 * → Chrome 앱을 명시 지정해서 오픈 (기기 기본 브라우저가 다르거나
 *   시스템이 임의로 다른 핸들러를 고르는 경우 방지)
 */
export async function openOAuthUrl(url: string): Promise<boolean> {
  if (Platform.OS === 'android') {
    const viaChrome = await openBrowserSafe(url, {
      browserPackage: 'com.android.chrome',
      showTitle: true,
      createTask: true,
      showInRecents: false,
    });
    if (viaChrome) return true;
  }

  try {
    const result = await openBrowserSafe(url, {
      createTask: true,
      showInRecents: false,
    });
    if (result) return true;
  } catch {
    // fallthrough
  }

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
