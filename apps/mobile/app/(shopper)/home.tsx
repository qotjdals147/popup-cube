import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeFeedChips } from '../../src/components/HomeFeedChips';
import { HomeProductTagChips } from '../../src/components/HomeProductTagChips';
import { HomeProductCard } from '../../src/components/HomeProductCard';
import { HomePromoBanner } from '../../src/components/HomePromoBanner';
import { ShopperLineIcon } from '../../src/components/ShopperLineIcon';
import { ShopperNotificationBell } from '../../src/components/ShopperNotificationBell';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { t } from '../../src/i18n/ko';
import { listHomePromoBanners, type HomeBannerSlide } from '../../src/lib/homeBanners';
import {
  listHomeProductFeed,
  sortHomeProductFeed,
  type HomeFeedSort,
  type HomeProductFeedItem,
} from '../../src/lib/homeProducts';
import {
  buildHomeProductTagMap,
  buildHomeTagFacets,
  getHomeProductTagsForFeed,
  homeProductMatchesTag,
  type HomeProductTagLink,
} from '../../src/lib/homeProductTags';
import { useRestoreSystemChromeOnFocus } from '../../src/hooks/useWorldImmersiveChrome';

/** AD-088 · 벤치 01~02 — 검색 · 배ner · 칩 · 상품 피드 */
export default function HomeScreen() {
  const router = useRouter();
  const { userId, bootstrapping, loading: authLoading, initError } = useAuth();
  const authPending = bootstrapping || authLoading;
  const { colors } = useTheme();
  useRestoreSystemChromeOnFocus();

  const [search, setSearch] = useState('');
  const [feedSort, setFeedSort] = useState<HomeFeedSort>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagLinks, setTagLinks] = useState<HomeProductTagLink[]>([]);
  const [products, setProducts] = useState<HomeProductFeedItem[]>([]);
  const [banners, setBanners] = useState<HomeBannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tagFacets = useMemo(() => buildHomeTagFacets(tagLinks), [tagLinks]);
  const productTagMap = useMemo(() => buildHomeProductTagMap(tagLinks), [tagLinks]);

  const sortedProducts = useMemo(() => {
    const sorted = sortHomeProductFeed(products, feedSort);
    if (!selectedTag) return sorted;
    return sorted.filter((p) => homeProductMatchesTag(p.id, selectedTag, productTagMap));
  }, [products, feedSort, selectedTag, productTagMap]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg },
        flex: { flex: 1 },
        header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, backgroundColor: colors.bgCard },
        headerTopRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        },
        headerBrandBlock: { flex: 1, minWidth: 0 },
        brandTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.3,
        },
        tagline: { color: colors.textSoft, fontSize: 13, marginTop: 4, marginBottom: 12 },
        searchWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
        },
        searchIconWrap: { marginRight: 8 },
        search: {
          flex: 1,
          color: colors.text,
          paddingVertical: 11,
          fontSize: 15,
        },
        listHeader: { paddingHorizontal: 16, paddingBottom: 8 },
        feedTitle: {
          marginTop: 16,
          fontSize: 16,
          fontWeight: '800',
          color: colors.text,
        },
        centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
        loadingText: { color: colors.textMuted, fontSize: 14 },
        error: { color: colors.danger, textAlign: 'center', padding: 20 },
        empty: { color: colors.textMuted, textAlign: 'center', padding: 32, fontSize: 15 },
        list: { paddingHorizontal: 12, paddingBottom: 16 },
        row: { gap: 10, marginBottom: 10 },
      }),
    [colors],
  );

  useEffect(() => {
    if (!authPending && !userId) {
      router.replace('/');
    }
  }, [authPending, userId, router]);

  useEffect(() => {
    let active = true;
    getHomeProductTagsForFeed()
      .then((links) => {
        if (active) setTagLinks(links);
      })
      .catch(() => {
        if (active) setTagLinks([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTag) return;
    const ok = tagFacets.some((f) => f.label === selectedTag);
    if (!ok && tagFacets.length > 0) setSelectedTag(null);
  }, [selectedTag, tagFacets]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    const timer = setTimeout(() => {
      Promise.all([
        listHomeProductFeed(search),
        listHomePromoBanners({
          title: t.home.bannerTitle,
          subtitle: t.home.bannerSub,
        }),
      ])
        .then(([feed, bannerSlides]) => {
          if (active) {
            setProducts(feed);
            setBanners(bannerSlides);
          }
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  function handleOpenProduct(item: HomeProductFeedItem) {
    router.push({
      pathname: '/store/[storeId]',
      params: { storeId: item.store_id, productId: item.id },
    });
  }

  function handleBannerPress(slide: HomeBannerSlide) {
    if (slide.linkUrl) {
      void Linking.openURL(slide.linkUrl);
      return;
    }
    if (!slide.storeId) return;
    router.push({
      pathname: '/store/[storeId]',
      params: slide.productId
        ? { storeId: slide.storeId, productId: slide.productId }
        : { storeId: slide.storeId },
    });
  }

  const listHeader = (
    <View style={styles.listHeader}>
      <HomePromoBanner slides={banners} onPressSlide={handleBannerPress} />
      <HomeFeedChips sort={feedSort} onChange={setFeedSort} />
      <HomeProductTagChips
        facets={tagFacets}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
      />
      <Text style={styles.feedTitle}>{t.home.feedTitle}</Text>
    </View>
  );

  if (authPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>로그인 확인 중…</Text>
      </View>
    );
  }

  if (!userId) {
    return null;
  }

  if (initError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{initError}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerBrandBlock}>
              <Text style={styles.brandTitle}>{t.home.title}</Text>
              <Text style={styles.tagline}>{t.home.tagline}</Text>
            </View>
            <ShopperNotificationBell />
          </View>
          <View style={styles.searchWrap}>
            <View style={styles.searchIconWrap} accessibilityElementsHidden>
              <ShopperLineIcon name="search" size={18} color={colors.textMuted} />
            </View>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder={t.home.searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
            />
          </View>
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>{t.home.loading}</Text>
          </View>
        )}

        {error && !loading && <Text style={styles.error}>{t.home.error}</Text>}

        {!loading && !error && (
          <FlatList
            data={sortedProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            style={styles.flex}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {selectedTag ? t.home.tagFilterEmpty : t.home.empty}
              </Text>
            }
            renderItem={({ item }) => (
              <HomeProductCard product={item} onPress={() => handleOpenProduct(item)} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
