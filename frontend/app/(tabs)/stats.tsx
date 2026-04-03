import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStatsStore } from '../../src/store/statsStore';
import { useAuthStore } from '../../src/store/authStore';
import { StatCard } from '../../src/components/StatCard';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { stats, fetchStats, isLoading } = useStatsStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);
  
  const maxBarValue = stats?.exits_by_day
    ? Math.max(...stats.exits_by_day.map(d => d.saved + d.forgotten), 1)
    : 1;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? COLORS.textDark : COLORS.text }]}>
            Forgetting Insights
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            Track your progress
          </Text>
        </View>
        
        {/* Streak Card */}
        {stats && (
          <View style={[
            styles.streakCard,
            {
              backgroundColor: COLORS.primary,
            },
            SHADOWS.medium,
          ]}>
            <View style={styles.streakContent}>
              <View style={styles.streakLeft}>
                <Ionicons name="flame" size={48} color={COLORS.streak} />
              </View>
              <View style={styles.streakRight}>
                <Text style={styles.streakValue}>{stats.current_streak}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
                <Text style={styles.bestStreak}>Best: {stats.best_streak} days</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Exits"
              value={stats?.total_exits || 0}
              icon="exit"
              color={COLORS.primary}
            />
            <View style={{ width: SPACING.md }} />
            <StatCard
              title="Items Saved"
              value={stats?.total_items_checked || 0}
              icon="checkmark-circle"
              color={COLORS.success}
            />
          </View>
          <View style={[styles.statsRow, { marginTop: SPACING.md }]}>
            <StatCard
              title="Forgotten"
              value={stats?.total_items_forgotten || 0}
              icon="alert-circle"
              color={COLORS.error}
            />
            <View style={{ width: SPACING.md }} />
            <StatCard
              title="Risk Score"
              value={`${stats?.risk_score || 0}%`}
              icon="warning"
              color={stats?.risk_score && stats.risk_score > 50 ? COLORS.error : COLORS.warning}
            />
          </View>
        </View>
        
        {/* Weekly Chart */}
        <View style={[
          styles.chartCard,
          { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
          SHADOWS.small,
        ]}>
          <Text style={[styles.chartTitle, { color: isDark ? COLORS.textDark : COLORS.text }]}>
            Last 7 Days
          </Text>
          <View style={styles.chartContainer}>
            {stats?.exits_by_day.map((day, index) => {
              const total = day.saved + day.forgotten;
              const savedHeight = total > 0 ? (day.saved / maxBarValue) * 100 : 0;
              const forgottenHeight = total > 0 ? (day.forgotten / maxBarValue) * 100 : 0;
              const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <View key={day.date} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, styles.barSaved, { height: `${savedHeight}%` }]} />
                    <View style={[styles.bar, styles.barForgotten, { height: `${forgottenHeight}%` }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.legendText, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
                Saved
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
              <Text style={[styles.legendText, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
                Forgotten
              </Text>
            </View>
          </View>
        </View>
        
        {/* Most Forgotten */}
        {stats?.most_forgotten_items && stats.most_forgotten_items.length > 0 && (
          <View style={[
            styles.forgottenCard,
            { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
            SHADOWS.small,
          ]}>
            <Text style={[styles.chartTitle, { color: isDark ? COLORS.textDark : COLORS.text }]}>
              Most Forgotten Items
            </Text>
            {stats.most_forgotten_items.map((item, index) => (
              <View key={item.name} style={styles.forgottenItem}>
                <View style={styles.forgottenLeft}>
                  <View style={[styles.forgottenRank, { backgroundColor: COLORS.error + '20' }]}>
                    <Text style={styles.forgottenRankText}>#{index + 1}</Text>
                  </View>
                  <Text style={[styles.forgottenName, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                    {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                  </Text>
                </View>
                <Text style={[styles.forgottenCount, { color: COLORS.error }]}>
                  {item.count}x
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Share Stats */}
        <Button
          title="Share My Stats"
          onPress={() => router.push('/share-card')}
          variant="outline"
          style={styles.shareBtn}
          icon={<Ionicons name="share-social" size={20} color={COLORS.primary} />}
        />
        
        {/* Period Stats */}
        <View style={styles.periodStats}>
          <View style={[
            styles.periodCard,
            { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
            SHADOWS.small,
          ]}>
            <Text style={[styles.periodTitle, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
              This Week
            </Text>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: isDark ? COLORS.textDark : COLORS.text }]}>Saved</Text>
              <Text style={[styles.periodValue, { color: COLORS.success }]}>{stats?.items_saved_week || 0}</Text>
            </View>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: isDark ? COLORS.textDark : COLORS.text }]}>Forgotten</Text>
              <Text style={[styles.periodValue, { color: COLORS.error }]}>{stats?.items_forgotten_week || 0}</Text>
            </View>
          </View>
          <View style={{ width: SPACING.md }} />
          <View style={[
            styles.periodCard,
            { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
            SHADOWS.small,
          ]}>
            <Text style={[styles.periodTitle, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
              This Month
            </Text>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: isDark ? COLORS.textDark : COLORS.text }]}>Saved</Text>
              <Text style={[styles.periodValue, { color: COLORS.success }]}>{stats?.items_saved_month || 0}</Text>
            </View>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: isDark ? COLORS.textDark : COLORS.text }]}>Forgotten</Text>
              <Text style={[styles.periodValue, { color: COLORS.error }]}>{stats?.items_forgotten_month || 0}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  streakCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakLeft: {
    marginRight: SPACING.lg,
  },
  streakRight: {
    flex: 1,
  },
  streakValue: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.9)',
  },
  bestStreak: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.xs,
  },
  statsGrid: {
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
  },
  chartCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: SPACING.md,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: 24,
    height: '100%',
    flexDirection: 'column-reverse',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  bar: {
    width: '100%',
  },
  barSaved: {
    backgroundColor: COLORS.success,
  },
  barForgotten: {
    backgroundColor: COLORS.error,
  },
  barLabel: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONTS.sizes.xs,
  },
  forgottenCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  forgottenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  forgottenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgottenRank: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  forgottenRankText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  forgottenName: {
    fontSize: FONTS.sizes.md,
  },
  forgottenCount: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  shareBtn: {
    marginBottom: SPACING.lg,
  },
  periodStats: {
    flexDirection: 'row',
  },
  periodCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  periodTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  periodLabel: {
    fontSize: FONTS.sizes.sm,
  },
  periodValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
  },
});
