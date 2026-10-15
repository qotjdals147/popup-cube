import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { HomeTagFacet } from '../lib/homeProductTags';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n/ko';

interface HomeProductTagChipsProps {
  facets: HomeTagFacet[];
  selectedTag: string | null;
  onSelectTag: (label: string | null) => void;
}

/** AD-088 §7.113 — 홈 피드 · 점주 `product_tags` 필터 */
export function HomeProductTagChips({ facets, selectedTag, onSelectTag }: HomeProductTagChipsProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { marginTop: 10, marginHorizontal: -16, paddingHorizontal: 16 },
        row: { flexDirection: 'row', gap: 8, paddingRight: 8 },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
        chipTextActive: { color: '#fff' },
        count: { fontSize: 12, fontWeight: '500', opacity: 0.85 },
      }),
    [colors],
  );

  if (facets.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      accessibilityLabel={t.home.tagFilterTitle}
    >
      <Pressable
        style={[styles.chip, selectedTag === null && styles.chipActive]}
        onPress={() => onSelectTag(null)}
        accessibilityRole="button"
        accessibilityState={{ selected: selectedTag === null }}
      >
        <Text style={[styles.chipText, selectedTag === null && styles.chipTextActive]}>
          {t.home.tagFilterAll}
        </Text>
      </Pressable>
      {facets.map((facet) => {
        const active = selectedTag === facet.label;
        return (
          <Pressable
            key={facet.label}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelectTag(facet.label)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{facet.label}</Text>
            <Text style={[styles.chipText, styles.count, active && styles.chipTextActive]}>
              {facet.productCount}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
