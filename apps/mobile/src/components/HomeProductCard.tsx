import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { HomeProductFeedItem } from '../lib/homeProducts';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n/ko';
import { getPopupPeriodBadge } from '../lib/popupPeriod';

function formatPrice(won: number): string {
  return `${won.toLocaleString('ko-KR')}원`;
}

interface HomeProductCardProps {
  product: HomeProductFeedItem;
  onPress: () => void;
}

/** AD-088 · 벤치 02 — 홈 상품 피드 카드 (D-day = 매장 팝업 기간) */
export function HomeProductCard({ product, onPress }: HomeProductCardProps) {
  const { colors } = useTheme();
  const period = getPopupPeriodBadge(product.popup_ends_at, {
    ended: t.home.periodEnded,
    today: t.home.periodToday,
    dDay: (n) => t.home.periodDDay(n),
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          backgroundColor: colors.bgCard,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        },
        thumbWrap: {
          aspectRatio: 0.78,
          backgroundColor: colors.bgElevated,
          position: 'relative',
        },
        thumb: { width: '100%', height: '100%' },
        thumbFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        thumbLetter: { color: colors.textMuted, fontSize: 28, fontWeight: '700' },
        periodBadge: {
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: period.tone === 'ended' ? colors.textMuted : colors.accent,
          paddingHorizontal: 7,
          paddingVertical: 3,
          borderRadius: 6,
        },
        periodBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
        body: { paddingHorizontal: 10, paddingVertical: 10, gap: 4 },
        storeName: { color: colors.textMuted, fontSize: 11 },
        name: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          lineHeight: 18,
        },
        price: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 2 },
      }),
    [colors, period.tone],
  );

  const initial = product.name.trim().charAt(0) || '?';

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.thumbWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.thumbFallback}>
            <Text style={styles.thumbLetter}>{initial}</Text>
          </View>
        )}
        <View style={styles.periodBadge}>
          <Text style={styles.periodBadgeText}>{period.label}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.storeName} numberOfLines={1}>
          {product.store_name}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>
    </Pressable>
  );
}
