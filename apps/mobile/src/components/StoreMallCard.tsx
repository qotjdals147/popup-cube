import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StoreSummary } from '../types/domain';
import { t } from '../i18n/ko';
import { getPopupPeriodBadge } from '../lib/popupPeriod';
import { colors } from '../theme/colors';

interface StoreMallCardProps {
  store: StoreSummary;
  onPreview: () => void;
  onEnter: () => void;
}

/** §58 #3 — 홈 몰 허브 매장 카드 (썸네일 · D-day · 설명 · 쇼핑하기) */
export function StoreMallCard({ store, onPreview, onEnter }: StoreMallCardProps) {
  const period = getPopupPeriodBadge(store.popup_ends_at, {
    ended: t.home.periodEnded,
    today: t.home.periodToday,
    dDay: (n) => t.home.periodDDay(n),
  });
  const isEnded = period.tone === 'ended';
  const description = store.description?.trim() || t.home.noDescription;

  return (
    <View style={[styles.card, isEnded && styles.cardEnded]}>
      <Pressable style={styles.preview} onPress={onPreview} accessibilityRole="button">
        <View style={styles.thumbWrap}>
          {store.thumbnail_url ? (
            <Image source={{ uri: store.thumbnail_url }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbFallback}>
              <Text style={styles.thumbLetter}>{store.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>{t.home.openBadge}</Text>
          </View>
          {period.tone !== 'none' && (
            <View
              style={[
                styles.periodBadge,
                period.tone === 'normal' && styles.periodBadgeNormal,
                period.tone === 'urgent' && styles.periodBadgeUrgent,
                period.tone === 'today' && styles.periodBadgeUrgent,
                period.tone === 'ended' && styles.periodBadgeEnded,
              ]}
            >
              <Text style={styles.periodBadgeText}>{period.label}</Text>
            </View>
          )}
        </View>
        <Text style={styles.storeName} numberOfLines={2}>
          {store.name}
        </Text>
        <Text style={styles.storeDesc} numberOfLines={2}>
          {description}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.enterButton,
          isEnded && styles.enterButtonDisabled,
          pressed && !isEnded && styles.enterButtonPressed,
        ]}
        disabled={isEnded}
        onPress={onEnter}
        accessibilityRole="button"
        accessibilityLabel={`${store.name} ${t.home.enter}`}
        accessibilityState={{ disabled: isEnded }}
      >
        <Text style={[styles.enterButtonText, isEnded && styles.enterButtonTextDisabled]}>
          {isEnded ? t.home.periodEnded : t.home.enter}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEnded: {
    opacity: 0.72,
  },
  preview: {
    flex: 1,
  },
  thumbWrap: {
    height: 128,
    backgroundColor: colors.bgElevated,
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbLetter: { color: colors.text, fontSize: 36, fontWeight: '700' },
  openBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.openBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  periodBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  periodBadgeNormal: {
    backgroundColor: '#1e4db7',
  },
  periodBadgeUrgent: {
    backgroundColor: colors.price,
  },
  periodBadgeEnded: {
    backgroundColor: '#868e96',
  },
  periodBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  storeName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingTop: 10,
    lineHeight: 20,
  },
  storeDesc: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 8,
    minHeight: 42,
  },
  enterButton: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  enterButtonPressed: {
    opacity: 0.88,
  },
  enterButtonDisabled: {
    backgroundColor: colors.border,
  },
  enterButtonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  enterButtonTextDisabled: {
    color: colors.textMuted,
  },
});
