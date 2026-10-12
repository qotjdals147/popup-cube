import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { HomeFeedSort } from '../lib/homeProducts';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n/ko';

interface HomeFeedChipsProps {
  sort: HomeFeedSort;
  onChange: (sort: HomeFeedSort) => void;
}

const SORTS: HomeFeedSort[] = ['all', 'new', 'ending'];

/** AD-088 · 벤치 02 — 피드 필터 칩 (카테고리 DB 전 · 정렬/탭) */
export function HomeFeedChips({ sort, onChange }: HomeFeedChipsProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { marginTop: 14, marginHorizontal: -16, paddingHorizontal: 16 },
        row: { flexDirection: 'row', gap: 8, paddingRight: 8 },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
        },
        chipActive: {
          backgroundColor: colors.text,
          borderColor: colors.text,
        },
        chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
        chipTextActive: { color: colors.bgCard },
      }),
    [colors],
  );

  const labels: Record<HomeFeedSort, string> = {
    all: t.home.chipAll,
    new: t.home.chipNew,
    ending: t.home.chipEnding,
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {SORTS.map((key) => {
        const active = sort === key;
        return (
          <Pressable
            key={key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{labels[key]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
