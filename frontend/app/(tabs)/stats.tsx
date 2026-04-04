import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useStatsStore } from '../../src/store/statsStore';
import { useAuthStore } from '../../src/store/authStore';
import { StatCard } from '../../src/components/StatCard';
import { Button } from '../../src/components/Button';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  
  const { stats, fetchStats, isLoading } = useStatsStore();
  const { user, isPremiumUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  
  const isPremium = isPremiumUser();
  
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Forgetting Insights
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
          { backgroundColor: colors.card },
          SHADOWS.small,
        ]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
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
                  <View style={[styles.barWrapper, { backgroundColor: colors.border }]}>
                    <View style={[styles.bar, styles.barSaved, { height: `${savedHeight}%` }]} />
                    <View style={[styles.bar, styles.barForgotten, { height: `${forgottenHeight}%` }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Saved
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Forgotten
              </Text>
            </View>
          </View>
        </View>
        
        {/* Most Forgotten */}
        {stats?.most_forgotten_items && stats.most_forgotten_items.length > 0 && (
          <View style={[
            styles.forgottenCard,
            { backgroundColor: colors.card },
            SHADOWS.small,
          ]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Most Forgotten Items
            </Text>
            {stats.most_forgotten_items.map((item, index) => (
              <View key={item.name} style={[styles.forgottenItem, { borderBottomColor: colors.border }]}>
                <View style={styles.forgottenLeft}>
                  <View style={[styles.forgottenRank, { backgroundColor: COLORS.error + '20' }]}>
                    <Text style={styles.forgottenRankText}>#{index + 1}</Text>
                  </View>
                  <Text style={[styles.forgottenName, { color: colors.text }]}>
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
        
        {/* Premium Advanced Insights */}
        {!isPremium ? (
          <TouchableOpacity
            style={[styles.premiumLockCard, { backgroundColor: colors.card }, SHADOWS.small]}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.8}
          >
            <View style={styles.premiumLockHeader}>
              <Ionicons name="lock-closed" size={20} color={COLORS.premium} />
              <Text style={[styles.premiumLockTitle, { color: colors.text }]}>
                Advanced Insights
              </Text>
              <View style={styles.premiumTag}>
                <Text style={styles.premiumTagText}>PRO</Text>
              </View>
            </View>
            <View style={styles.premiumLockFeatures}>
              <View style={styles.premiumLockItem}>
                <Ionicons name="bar-chart" size={14} color={colors.textSecondary} />
                <Text style={[styles.premiumLockItemText, { color: colors.textSecondary }]}>
                  Monthly & yearly trends
                </Text>
              </View>
              <View style={styles.premiumLockItem}>
                <Ionicons name="bulb" size={14} color={colors.textSecondary} />
                <Text style={[styles.premiumLockItemText, { color: colors.textSecondary }]}>
                  Smart forgetting patterns
                </Text>
              </View>
              <View style={styles.premiumLockItem}>
                <Ionicons name="analytics" size={14} color={colors.textSecondary} />
                <Text style={[styles.premiumLockItemText, { color: colors.textSecondary }]}>
                  Location-based insights
                </Text>
              </View>
            </View>
            <View style={styles.premiumLockCTA}>
              <Text style={styles.premiumLockCTAText}>Unlock with Premium</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.premium} />
            </View>
          </TouchableOpacity>
        ) : (
          <View>
            {/* Premium: Advanced Insights Section */}
            <View style={[styles.premiumInsightsCard, { backgroundColor: colors.card }, SHADOWS.small]}>
              <View style={styles.premiumInsightsHeader}>
                <Ionicons name="diamond" size={18} color={COLORS.premium} />
                <Text style={[styles.premiumInsightsTitle, { color: colors.text }]}>
                  Advanced Insights
                </Text>
              </View>
              
              {/* Smart Forgetting Pattern */}
              <View style={[styles.insightRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.insightIcon, { backgroundColor: '#6366F120' }]}>
                  <Ionicons name="bulb" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Most Forgotten</Text>
                  <Text style={[styles.insightValue, { color: colors.text }]}>
                    {stats?.most_forgotten_item || 'Keys'}
                  </Text>
                </View>
                <View style={[styles.insightBadge, { backgroundColor: COLORS.error + '15' }]}>
                  <Text style={[styles.insightBadgeText, { color: COLORS.error }]}>
                    {stats?.items_forgotten_week || 0}x/week
                  </Text>
                </View>
              </View>
              
              {/* Peak Forgetting Time */}
              <View style={[styles.insightRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.insightIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="time" size={16} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Peak Forgetting Time</Text>
                  <Text style={[styles.insightValue, { color: colors.text }]}>Morning (8-9 AM)</Text>
                </View>
                <Ionicons name="alert-circle" size={18} color="#F59E0B" />
              </View>
              
              {/* Success Rate */}
              <View style={[styles.insightRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.insightIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Ionicons name="trending-up" size={16} color={COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Weekly Improvement</Text>
                  <Text style={[styles.insightValue, { color: COLORS.success }]}>+12% this week</Text>
                </View>
                <Ionicons name="arrow-up-circle" size={18} color={COLORS.success} />
              </View>
            </View>

            {/* Premium: Smart Suggestions */}
            <View style={[styles.premiumInsightsCard, { backgroundColor: colors.card, marginTop: SPACING.md }, SHADOWS.small]}>
              <View style={styles.premiumInsightsHeader}>
                <Ionicons name="sparkles" size={18} color="#F59E0B" />
                <Text style={[styles.premiumInsightsTitle, { color: colors.text }]}>
                  Smart Suggestions
                </Text>
              </View>
              
              <View style={styles.suggestionItem}>
                <View style={[styles.suggestionDot, { backgroundColor: COLORS.primary }]} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  Add "Umbrella" to your checklist — rain forecast for tomorrow
                </Text>
              </View>
              <View style={styles.suggestionItem}>
                <View style={[styles.suggestionDot, { backgroundColor: COLORS.success }]} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  You rarely forget items on weekends — keep it up!
                </Text>
              </View>
              <View style={styles.suggestionItem}>
                <View style={[styles.suggestionDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  Consider enabling location reminders for your office
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Period Stats */}
        <View style={styles.periodStats}>
          <View style={[
            styles.periodCard,
            { backgroundColor: colors.card },
            SHADOWS.small,
          ]}>
            <Text style={[styles.periodTitle, { color: colors.textSecondary }]}>
              This Week
            </Text>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: colors.text }]}>Saved</Text>
              <Text style={[styles.periodValue, { color: COLORS.success }]}>{stats?.items_saved_week || 0}</Text>
            </View>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: colors.text }]}>Forgotten</Text>
              <Text style={[styles.periodValue, { color: COLORS.error }]}>{stats?.items_forgotten_week || 0}</Text>
            </View>
          </View>
          <View style={{ width: SPACING.md }} />
          <View style={[
            styles.periodCard,
            { backgroundColor: colors.card },
            SHADOWS.small,
          ]}>
            <Text style={[styles.periodTitle, { color: colors.textSecondary }]}>
              This Month
            </Text>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: colors.text }]}>Saved</Text>
              <Text style={[styles.periodValue, { color: COLORS.success }]}>{stats?.items_saved_month || 0}</Text>
            </View>
            <View style={styles.periodRow}>
              <Text style={[styles.periodLabel, { color: colors.text }]}>Forgotten</Text>
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
  premiumLockCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.premium + '30',
  },
  premiumLockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  premiumLockTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  premiumTag: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  premiumTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumLockFeatures: {
    marginBottom: SPACING.sm,
  },
  premiumLockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: SPACING.sm,
  },
  premiumLockItemText: {
    fontSize: FONTS.sizes.sm,
  },
  premiumLockCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.premium + '20',
    gap: 4,
  },
  premiumLockCTAText: {
    color: COLORS.premium,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  // Premium Insights styles
  premiumInsightsCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  premiumInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  premiumInsightsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  insightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  suggestionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
