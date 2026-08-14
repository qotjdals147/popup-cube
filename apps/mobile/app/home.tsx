import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StoreSummary } from '../src/types/domain';
import { StoreEnterModal } from '../src/components/StoreEnterModal';
import { ShopperBottomNav } from '../src/components/ShopperBottomNav';
import { useAuth } from '../src/context/AuthContext';
import { t } from '../src/i18n/ko';
import { listPublishedStores } from '../src/lib/stores';
import { colors } from '../src/theme/colors';
import { useRestoreSystemChromeOnFocus } from '../src/hooks/useWorldImmersiveChrome';

/** m03 — 동네 필터는 Sprint 이후; 지금은 매장 목록 + 검색 */
export default function HomeScreen() {
  const router = useRouter();
  const { userId, loading: authLoading, initError } = useAuth();
  useRestoreSystemChromeOnFocus();

  const [search, setSearch] = useState('');
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreSummary | null>(null);

  useEffect(() => {
    if (!authLoading && !userId) {
      router.replace('/');
    }
  }, [authLoading, userId, router]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    const timer = setTimeout(() => {
      listPublishedStores(search)
        .then((data) => {
          if (active) setStores(data);
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

  function handleEnterStore(storeId: string) {
    setSelectedStore(null);
    router.push(`/store/${storeId}`);
  }

  if (authLoading) {
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>{t.home.title}</Text>
          <Text style={styles.tagline}>{t.home.tagline}</Text>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon} accessibilityElementsHidden>
              🔍
            </Text>
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
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>{t.home.loading}</Text>
          </View>
        )}

        {error && !loading && <Text style={styles.error}>{t.home.error}</Text>}

        {!loading && !error && stores.length === 0 && (
          <Text style={styles.empty}>{t.home.empty}</Text>
        )}

        {!loading && !error && stores.length > 0 && (
          <FlatList
            data={stores}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            style={styles.flex}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => setSelectedStore(item)}>
                <View style={styles.thumbWrap}>
                  {item.thumbnail_url ? (
                    <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Text style={styles.thumbLetter}>{item.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>OPEN</Text>
                  </View>
                </View>
                <Text style={styles.storeName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.enterLink}>{t.home.enter}</Text>
              </Pressable>
            )}
          />
        )}

        {selectedStore && (
          <StoreEnterModal
            store={selectedStore}
            visible={!!selectedStore}
            onEnter={() => handleEnterStore(selectedStore.id)}
            onClose={() => setSelectedStore(null)}
          />
        )}
      </View>
      <ShopperBottomNav active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, backgroundColor: colors.bgCard },
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
  searchIcon: { fontSize: 16, marginRight: 8 },
  search: {
    flex: 1,
    color: colors.text,
    paddingVertical: 11,
    fontSize: 15,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  error: { color: '#fca5a5', textAlign: 'center', padding: 20 },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 32, fontSize: 15 },
  list: { padding: 12 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbWrap: { height: 120, backgroundColor: colors.bgElevated },
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
  storeName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingTop: 10,
    minHeight: 40,
  },
  enterLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    padding: 10,
  },
});
