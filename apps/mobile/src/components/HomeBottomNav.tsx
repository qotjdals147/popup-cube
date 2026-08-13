import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n/ko';
import { colors } from '../theme/colors';

type Tab = 'home' | 'me';

/** 홈 · 내 정보 하단 탭 (m03 · m10) */
export function HomeBottomNav({ active }: { active: Tab }) {
  const router = useRouter();

  return (
    <View style={styles.bar}>
      <Pressable
        style={[styles.item, active === 'home' && styles.itemActive]}
        onPress={() => {
          if (active !== 'home') router.replace('/home');
        }}
      >
        <Text style={[styles.label, active === 'home' && styles.labelActive]}>{t.home.navStores}</Text>
      </Pressable>
      <Pressable
        style={[styles.item, active === 'me' && styles.itemActive]}
        onPress={() => {
          if (active !== 'me') router.push('/me');
        }}
      >
        <Text style={[styles.label, active === 'me' && styles.labelActive]}>{t.me.navTitle}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgCard,
    paddingBottom: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: -StyleSheet.hairlineWidth,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.primary,
  },
});
