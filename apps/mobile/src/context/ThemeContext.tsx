import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { shopperDark, shopperLight, type ShopperThemeColors } from '../theme/shopperTheme';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'popup_cube_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ShopperThemeColors;
  isDark: boolean;
  ready: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleDark: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'dark' || stored === 'light') {
          setModeState(stored);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleDark = useCallback(async () => {
    await setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? shopperDark : shopperLight,
      isDark: mode === 'dark',
      ready,
      setMode,
      toggleDark,
    }),
    [mode, ready, setMode, toggleDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
