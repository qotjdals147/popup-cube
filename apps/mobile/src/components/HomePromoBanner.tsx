import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import type { HomeBannerSlide } from '../lib/homeBanners';
import { useTheme } from '../context/ThemeContext';

const AUTO_MS = 4500;
const HORIZONTAL_PAD = 16;
const SLIDE_GAP = 10;

interface HomePromoBannerProps {
  slides: HomeBannerSlide[];
  onPressSlide?: (slide: HomeBannerSlide) => void;
}

/** AD-088 · 벤치 01 — 검색 아래 배ner 슬라이드 */
export function HomePromoBanner({ slides, onPressSlide }: HomePromoBannerProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = windowWidth - HORIZONTAL_PAD * 2;
  const listRef = useRef<FlatList<HomeBannerSlide>>(null);
  const [index, setIndex] = useState(0);
  const userScrolling = useRef(false);

  const multi = slides.length > 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginTop: 12 },
        slide: {
          width: slideWidth,
          marginRight: multi ? SLIDE_GAP : 0,
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: 92,
          justifyContent: 'flex-end',
        },
        slideSolid: {
          backgroundColor: colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 14,
          justifyContent: 'center',
        },
        image: { ...StyleSheet.absoluteFillObject, width: slideWidth, height: '100%' },
        imageScrim: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.35)',
        },
        textBlock: { paddingHorizontal: 16, paddingVertical: 14 },
        title: { color: '#fff', fontSize: 17, fontWeight: '800' },
        sub: { color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 6, lineHeight: 18 },
        dots: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          marginTop: 8,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
        },
        dotActive: { backgroundColor: colors.primary, width: 16 },
      }),
    [colors.border, colors.primary, slideWidth, multi],
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const scrollTo = useCallback(
    (next: number) => {
      if (!multi) return;
      listRef.current?.scrollToOffset({
        offset: next * (slideWidth + SLIDE_GAP),
        animated: true,
      });
    },
    [multi, slideWidth],
  );

  useEffect(() => {
    if (!multi) return;
    const timer = setInterval(() => {
      if (userScrolling.current) return;
      setIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollTo(next);
        return next;
      });
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [multi, scrollTo, slides.length]);

  function handleScrollBegin() {
    userScrolling.current = true;
  }

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    userScrolling.current = false;
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (slideWidth + SLIDE_GAP));
    setIndex(Math.min(Math.max(next, 0), slides.length - 1));
  }

  function handlePress(slide: HomeBannerSlide) {
    if (!onPressSlide) return;
    if (slide.linkUrl || slide.storeId) onPressSlide(slide);
  }

  if (slides.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={multi ? slideWidth + SLIDE_GAP : undefined}
        snapToAlignment="start"
        disableIntervalMomentum
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ paddingHorizontal: 0 }}
        renderItem={({ item }) => {
          const pressable = Boolean(onPressSlide && (item.linkUrl || item.storeId));
          const body = (
            <>
              {item.imageUrl ? (
                <>
                  <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
                  <View style={styles.imageScrim} />
                  <View style={styles.textBlock}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.sub} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={[styles.slideSolid, { backgroundColor: item.accentColor }]}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </View>
              )}
            </>
          );

          return (
            <Pressable
              style={styles.slide}
              onPress={() => handlePress(item)}
              disabled={!pressable}
              accessibilityRole={pressable ? 'button' : 'text'}
            >
              {body}
            </Pressable>
          );
        }}
      />
      {multi && (
        <View style={styles.dots} accessibilityLabel={`배ner ${index + 1} / ${slides.length}`}>
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}
