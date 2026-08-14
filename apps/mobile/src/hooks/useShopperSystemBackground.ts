import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

/** 네이티브 윈도우 배경 — Stack/Tabs 전환 시 흰 번쩍임 방지 */
export function useShopperSystemBackground(active = true) {
  const { colors, ready } = useTheme();

  useEffect(() => {
    if (!active || !ready) return;
    void SystemUI.setBackgroundColorAsync(colors.bg);
  }, [active, ready, colors.bg]);
}
