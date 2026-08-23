/**
 * Portfolio Tab — holdings with live P&L from the backend.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePortfolioStore } from '../../src/store/usePortfolioStore';
import { portfolioValue } from '../../src/api/market';
import { HoldingCard } from '../../src/components/portfolio/HoldingCard';
import { AddHoldingSheet } from '../../src/components/portfolio/AddHoldingSheet';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, radius } from '../../src/theme/spacing';
import { formatINR, formatPct, signColor } from '../../src/utils/formatters';
import type { PortfolioResult, HoldingResult } from '../../src/types/portfolio';

import { useAuthStore } from '../../src/store/useAuthStore';

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  const { holdings, addHolding, removeHolding } = usePortfolioStore();
  const [addVisible, setAddVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = () => {
    Alert.alert(
      'Disconnect Terminal',
      'Are you sure you want to sign out and return to the 3D gateway?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const fetchValues = useCallback(async () => {
    if (!holdings.length) return;
    setLoading(true);
    setError(null);
    try {
      const payload = holdings.map((h) => ({
        symbol: h.symbol,
        qty: h.qty,
        buy_price: h.buy_price,
      }));
      const res = await portfolioValue(payload) as PortfolioResult;
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch portfolio values');
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  function confirmRemove(symbol: string) {
    Alert.alert(
      'Remove Holding',
      `Remove ${symbol} from your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeHolding(symbol) },
      ],
    );
  }

  // Map holding results by symbol
  const resultMap: Record<string, HoldingResult> = {};
  result?.holdings.forEach((h) => { resultMap[h.symbol] = h; });

  const pnlColor = signColor(result?.total_pnl);

  return (
    <View style={styles.container}>
      {/* Trader Clearance & Profile Status Banner */}
      <View style={styles.traderBar}>
        <View style={styles.traderInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '⚡'}
            </Text>
          </View>
          <View>
            <View style={styles.traderBadgeRow}>
              <Text style={styles.traderName} numberOfLines={1}>
                {user?.displayName || 'Institutional Trader'}
              </Text>
              <View style={styles.clearanceTag}>
                <Text style={styles.clearanceTagText}>
                  {user?.isGuest ? 'DEMO ALPHA' : 'VERIFIED ID'}
                </Text>
              </View>
            </View>
            <Text style={styles.traderEmail} numberOfLines={1}>
              {user?.email || 'authenticated'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          style={styles.signOutBtn}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Summary banner */}
      {holdings.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Invested</Text>
            <Text style={styles.summaryValue}>{formatINR(result?.total_invested)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Current Value</Text>
            {loading
              ? <Skeleton width={80} height={18} />
              : <Text style={styles.summaryValue}>{formatINR(result?.total_current_value)}</Text>
            }
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total P&L</Text>
            {loading
              ? <Skeleton width={80} height={18} />
              : (
                <View>
                  <Text style={[styles.summaryValue, { color: pnlColor }]}>
                    {formatINR(result?.total_pnl)}
                  </Text>
                  <Text style={[styles.summaryPct, { color: pnlColor }]}>
                    {formatPct(result?.total_pnl_pct)}
                  </Text>
                </View>
              )
            }
          </View>
        </View>
      )}

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* Holdings list */}
      {!holdings.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💼</Text>
          <Text style={styles.emptyTitle}>No holdings yet</Text>
          <Text style={styles.emptyBody}>
            Add your first holding to start tracking your portfolio with live P&L.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAddVisible(true)}
            style={styles.addEmptyBtn}
          >
            <Text style={styles.addEmptyText}>+ Add Holding</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={holdings}
          keyExtractor={(h) => h.symbol}
          renderItem={({ item: h }) => (
            <HoldingCard
              result={
                resultMap[h.symbol] ?? {
                  symbol: h.symbol,
                  name: h.name,
                  qty: h.qty,
                  buy_price: h.buy_price,
                  invested: h.qty * h.buy_price,
                  current_price: null,
                  current_value: null,
                  pnl: null,
                  pnl_pct: null,
                  change_pct: null,
                  stale: true,
                }
              }
              onRemove={confirmRemove}
              onPress={(sym) => router.push(`/stock/${encodeURIComponent(sym)}`)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchValues}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — add holding */}
      {holdings.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAddVisible(true)}
          style={[styles.fab, { bottom: insets.bottom + 80 }]}
        >
          <Text style={styles.fabText}>+ Add</Text>
        </TouchableOpacity>
      )}

      <AddHoldingSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={addHolding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  traderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(212, 150, 58, 0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 150, 58, 0.18)',
  },
  traderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: typography.sansBold,
    fontSize: 15,
    color: colors.accentLight,
  },
  traderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  traderName: {
    fontFamily: typography.sansBold,
    fontSize: 13,
    color: colors.textPrimary,
    maxWidth: 140,
  },
  clearanceTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  clearanceTagText: {
    fontFamily: typography.monoMedium,
    fontSize: 8,
    color: colors.bull,
    letterSpacing: 0.5,
  },
  traderEmail: {
    fontFamily: typography.mono,
    fontSize: 10,
    color: colors.textMuted,
    maxWidth: 180,
  },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  signOutText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.bear,
  },
  summary: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  summaryPct: {
    fontSize: typography.size.xs,
    fontFamily: typography.sansMedium,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(244,63,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.25)',
    margin: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.bear,
  },
  list: {
    padding: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontFamily: typography.sansBold,
    color: colors.textSecondary,
  },
  emptyBody: {
    fontSize: typography.size.sm,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },
  addEmptyBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  addEmptyText: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    elevation: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.accent,
  },
});
