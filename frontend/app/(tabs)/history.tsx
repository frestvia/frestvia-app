import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useStatsStore, ExitRecord } from '../../src/store/statsStore';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  
  const { exitHistory, fetchExitHistory } = useStatsStore();
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchExitHistory();
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExitHistory();
    setRefreshing(false);
  }, []);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };
  
  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
  };
  
  // Group exits by date
  const groupedExits: { [key: string]: ExitRecord[] } = {};
  exitHistory.forEach((exit) => {
    const dateKey = formatDate(exit.created_at);
    if (!groupedExits[dateKey]) {
      groupedExits[dateKey] = [];
    }
    groupedExits[dateKey].push(exit);
  });
  
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
            Exit History
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your past check routines
          </Text>
        </View>
        
        {Object.keys(groupedExits).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={COLORS.light.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exit history yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start using Exit Mode to track your routines
            </Text>
          </View>
        ) : (
          Object.entries(groupedExits).map(([dateKey, exits]) => (
            <View key={dateKey} style={styles.dateGroup}>
              <Text style={[styles.dateHeader, { color: colors.text }]}>
                {dateKey}
              </Text>
              
              {exits.map((exit) => {
                const checkedCount = exit.checked_items.length;
                const forgottenCount = exit.forgotten_items.length;
                const isPerfect = forgottenCount === 0;
                
                return (
                  <View
                    key={exit.id}
                    style={[
                      styles.exitCard,
                      {
                        backgroundColor: colors.card,
                        borderLeftColor: isPerfect ? COLORS.success : COLORS.error,
                      },
                      SHADOWS.small,
                    ]}
                  >
                    <View style={styles.exitHeader}>
                      <View style={styles.exitLeft}>
                        <Ionicons
                          name={isPerfect ? 'checkmark-circle' : 'alert-circle'}
                          size={24}
                          color={isPerfect ? COLORS.success : COLORS.error}
                        />
                        <View style={styles.exitInfo}>
                          <Text style={[styles.exitName, { color: colors.text }]}>
                            {exit.checklist_name}
                          </Text>
                          <Text style={[styles.exitTime, { color: colors.textSecondary }]}>
                            {formatTime(exit.created_at)}
                            {exit.location_name && ` • ${exit.location_name}`}
                          </Text>
                        </View>
                      </View>
                      {isPerfect && (
                        <View style={styles.perfectBadge}>
                          <Text style={styles.perfectText}>Perfect!</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.exitStats}>
                      <View style={styles.exitStat}>
                        <Ionicons name="checkmark" size={16} color={COLORS.success} />
                        <Text style={[styles.exitStatText, { color: COLORS.success }]}>
                          {checkedCount} checked
                        </Text>
                      </View>
                      {forgottenCount > 0 && (
                        <View style={styles.exitStat}>
                          <Ionicons name="close" size={16} color={COLORS.error} />
                          <Text style={[styles.exitStatText, { color: COLORS.error }]}>
                            {forgottenCount} forgotten
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  exitCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
  },
  exitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  exitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exitInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  exitName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  exitTime: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  perfectBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  perfectText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  exitStats: {
    flexDirection: 'row',
    marginLeft: 32,
  },
  exitStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  exitStatText: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.xs,
  },
});
