import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n/ko';

interface HomePromoBannerProps {
  onPress?: () => void;
}

/** AD-088 · 벤치 01 — 검색 아래 배너 슬롯 (v1: 단일 플레이스홀더) */
export function HomePromoBanner({ onPress }: HomePromoBannerProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 12,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.primary,
          minHeight: 88,
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        title: { color: '#fff', fontSize: 17, fontWeight: '800' },
        sub: { color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 6, lineHeight: 18 },
      }),
    [colors.primary],
  );

  return (
    <Pressable
      style={styles.wrap}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <Text style={styles.title}>{t.home.bannerTitle}</Text>
      <Text style={styles.sub}>{t.home.bannerSub}</Text>
    </Pressable>
  );
}
