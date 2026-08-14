import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StoreSummary } from '../../src/types/domain';
import { StoreEnterModal } from '../../src/components/StoreEnterModal';
import { StoreMallCard } from '../../src/components/StoreMallCard';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { t } from '../../src/i18n/ko';
import { sortStoresByPopupEnd } from '../../src/lib/popupPeriod';
import { listPublishedStores } from '../../src/lib/stores';
import { useRestoreSystemChromeOnFocus } from '../../src/hooks/useWorldImmersiveChrome';

/** §58 #3 — 몰(홈) 허브: 검색 · D-day · 설명 · 쇼핑하기 CTA */
export default function HomeScreen() {
  const router = useRouter();
  const { userId, loading: authLoading, initError } = useAuth();
  const { colors } = useTheme();
  useRestoreSystemChromeOnFocus();

  const [search, setSearch] = useState('');
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreSummary | null>(null);

  const sortedStores = useMemo(() => sortStoresByPopupEnd(stores), [stores]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        error: { color: colors.danger, textAlign: 'center', padding: 20 },
        empty: { color: colors.textMuted, textAlign: 'center', padding: 32, fontSize: 15 },
        list: { padding: 12, paddingBottom: 4 },
        row: { gap: 12, marginBottom: 12 },
      }),
    [colors],
  );

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
    <SafeAreaView style={styles.safe} edges={['top']}>
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
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>{t.home.loading}</Text>
          </View>
        )}

        {error && !loading && <Text style={styles.error}>{t.home.error}</Text>}

        {!loading && !error && stores.length === 0 && (
          <Text style={styles.empty}>{t.home.empty}</Text>
        )}

        {!loading && !error && sortedStores.length > 0 && (
          <FlatList
            data={sortedStores}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            style={styles.flex}
            renderItem={({ item }) => (
              <StoreMallCard
                store={item}
                onPreview={() => setSelectedStore(item)}
                onEnter={() => handleEnterStore(item.id)}
              />
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
    </SafeAreaView>
  );
}
