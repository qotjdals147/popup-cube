import { readFileSync } from 'fs';
import { join } from 'path';
import type { ExpoConfig } from 'expo/config';

function readDotEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const raw = readFileSync(join(__dirname, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // .env 없으면 process.env 사용
  }
  return out;
}

const dotenv = readDotEnv();

const config: ExpoConfig = {
  name: 'POP-UP CUBE',
  slug: 'popup-cube',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'popupcube',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0E1A',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.popupcube.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#0A0E1A',
    },
    package: 'com.popupcube.app',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: dotenv.EXPO_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: dotenv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    /** Sprint 4-1 — 앱 WebView가 로드할 웹 오리진 (`/play/:storeId`) */
    webOrigin:
      dotenv.EXPO_PUBLIC_WEB_ORIGIN ??
      process.env.EXPO_PUBLIC_WEB_ORIGIN ??
      'https://popup-cube-web.vercel.app',
    router: {},
    eas: {
      projectId: '49c42cb0-df70-47a8-b34d-22878a8e3529',
    },
  },
};

export default config;
