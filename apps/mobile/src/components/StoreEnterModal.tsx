import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StoreSummary } from '../types/domain';
import { t } from '../i18n/ko';
import { getPopupPeriodBadge } from '../lib/popupPeriod';
import { colors } from '../theme/colors';

interface StoreEnterModalProps {
  store: StoreSummary;
  visible: boolean;
  onEnter: () => void;
  onClose: () => void;
}

export function StoreEnterModal({ store, visible, onEnter, onClose }: StoreEnterModalProps) {
  const period = getPopupPeriodBadge(store.popup_ends_at, {
    ended: t.home.periodEnded,
    today: t.home.periodToday,
    dDay: (n) => t.home.periodDDay(n),
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.thumbnailWrap}>
            {store.thumbnail_url ? (
              <Image source={{ uri: store.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={styles.thumbnailFallback}>
                <Text style={styles.fallbackLetter}>{store.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{store.name}</Text>
          {period.tone !== 'none' && (
            <View style={[styles.periodPill, period.tone === 'urgent' || period.tone === 'today' ? styles.periodPillUrgent : styles.periodPillNormal]}>
              <Text style={styles.periodPillText}>{period.label}</Text>
            </View>
          )}
          <Text style={styles.commerceNote}>{t.enterModal.commerceNote}</Text>
          <Text style={styles.description}>
            {store.description || t.enterModal.noDescription}
          </Text>
          <Pressable style={styles.enterButton} onPress={onEnter}>
            <Text style={styles.enterButtonText}>{t.enterModal.enter}</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t.enterModal.close}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  thumbnailWrap: {
    height: 200,
    backgroundColor: colors.bgElevated,
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: { color: colors.text, fontSize: 48, fontWeight: '700' },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  periodPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  periodPillNormal: {
    backgroundColor: '#eef4ff',
  },
  periodPillUrgent: {
    backgroundColor: '#ffe3e3',
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  commerceNote: {
    color: colors.textSoft,
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  enterButton: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  enterButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  closeButton: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: { color: colors.textMuted, fontSize: 14 },
});
