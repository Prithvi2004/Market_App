/**
 * Search Modal Screen — symbol search with instant suggestions and NIFTY 50 defaults.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchSymbols, useSymbols } from '../src/api/market';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { shortSymbol } from '../src/utils/formatters';
import type { SearchHit } from '../src/types/market';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  // Default symbols for quick search
  const { data: defaultSymbols } = useSymbols();

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchSymbols(query.trim());
        setHits(results);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(symbol: string) {
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  }

  const displayData = query.trim() ? hits : defaultSymbols ?? [];

  return (
    <>
      <Stack.Screen options={{ title: 'Search Market' }} />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Search Input Bar */}
        <View style={styles.inputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search stock (e.g. RELIANCE, TATAMOTORS)"
            placeholderTextColor={colors.textDim}
            autoCapitalize="characters"
            autoFocus
            style={styles.input}
          />
          {query.length > 0 && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading / Results Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {query.trim() ? 'Search Results' : 'NIFTY 50 Popular Symbols'}
          </Text>
          {loading && <ActivityIndicator size="small" color={colors.accent} />}
        </View>

        {/* Results List */}
        {!displayData.length && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matching symbols found</Text>
          </View>
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.symbol}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelect(item.symbol)}
                style={styles.hitRow}
              >
                <View style={styles.symbolBadge}>
                  <Text style={styles.symbolText}>{shortSymbol(item.symbol)}</Text>
                </View>
                <View style={styles.hitInfo}>
                  <Text style={styles.hitName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.hitEx}>{item.exchange || 'NSE'} · {item.symbol}</Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: 8,
  },
  searchIcon: {
    fontSize: typography.size.md,
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    fontFamily: typography.sans,
    color: colors.textPrimary,
  },
  clearIcon: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
    gap: 12,
  },
  symbolBadge: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  symbolText: {
    fontSize: typography.size.sm,
    fontFamily: typography.monoMedium,
    color: colors.accent,
  },
  hitInfo: {
    flex: 1,
  },
  hitName: {
    fontSize: typography.size.md,
    fontFamily: typography.sansMedium,
    color: colors.textPrimary,
  },
  hitEx: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: typography.size.md,
    color: colors.textMuted,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
  },
});
