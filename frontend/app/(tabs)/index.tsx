import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { useChecklistStore, Checklist } from '../../src/store/checklistStore';
import { useStatsStore } from '../../src/store/statsStore';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';
import { StatCard } from '../../src/components/StatCard';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  
  const { user } = useAuthStore();
  const { checklists, fetchChecklists, setActiveChecklist } = useChecklistStore();
  const { stats, fetchStats } = useStatsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  
  const buttonScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);
  
  useEffect(() => {
    fetchChecklists();
    fetchStats();
    
    pulseOpacity.value = withRepeat(
      withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  
  useEffect(() => {
    if (checklists.length > 0 && !selectedChecklist) {
      setSelectedChecklist(checklists[0]);
    }
  }, [checklists]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchChecklists(), fetchStats()]);
    setRefreshing(false);
  }, []);
  
  const handleExitMode = () => {
    if (!selectedChecklist) {
      Alert.alert(t('common.error'), 'Please create a checklist first');
      return;
    }
    setActiveChecklist(selectedChecklist);
    router.push('/exit-mode');
  };
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };
  
  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };
  
  const getChecklistIcon = (type: string) => {
    switch (type) {
      case 'home': return 'home';
      case 'travel': return 'airplane';
      case 'office': return 'briefcase';
      default: return 'list';
    }
  };
  
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
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {t('auth.welcomeBack')}
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.name || t('auth.guestUser')}
            </Text>
          </View>
          {stats && stats.current_streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={20} color={COLORS.streak} />
              <Text style={styles.streakText}>{stats.current_streak}</Text>
            </View>
          )}
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <StatCard
            title={t('home.itemsSaved')}
            value={stats?.items_saved_today || 0}
            icon="checkmark-circle"
            color={COLORS.success}
            subtitle={t('common.today')}
          />
          <View style={{ width: SPACING.md }} />
          <StatCard
            title={t('home.forgotten')}
            value={stats?.items_forgotten_today || 0}
            icon="alert-circle"
            color={COLORS.error}
            subtitle={t('common.today')}
          />
        </View>
        
        {/* Risk Score */}
        {stats && (
          <View style={[
            styles.riskCard,
            { backgroundColor: colors.card },
            SHADOWS.small,
          ]}>
            <View style={styles.riskHeader}>
              <Text style={[styles.riskTitle, { color: colors.text }]}>
                {t('home.riskScore')}
              </Text>
              <Text style={[
                styles.riskValue,
                {
                  color: stats.risk_score > 60
                    ? COLORS.error
                    : stats.risk_score > 30
                    ? COLORS.warning
                    : COLORS.success,
                },
              ]}>
                {stats.risk_score}%
              </Text>
            </View>
            <View style={styles.riskBar}>
              <View
                style={[
                  styles.riskFill,
                  {
                    width: `${stats.risk_score}%`,
                    backgroundColor: stats.risk_score > 60
                      ? COLORS.error
                      : stats.risk_score > 30
                      ? COLORS.warning
                      : COLORS.success,
                  },
                ]}
              />
            </View>
            <Text style={[styles.riskMessage, { color: colors.textSecondary }]}>
              {stats.risk_score > 60
                ? t('home.highRisk')
                : stats.risk_score > 30
                ? t('home.moderateRisk')
                : t('home.lowRisk')}
            </Text>
          </View>
        )}
        
        {/* Checklist Selector */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.selectChecklist')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.checklistScroll}
          contentContainerStyle={styles.checklistScrollContent}
        >
          {checklists.map((checklist) => (
            <TouchableOpacity
              key={checklist.id}
              style={[
                styles.checklistChip,
                {
                  backgroundColor: selectedChecklist?.id === checklist.id
                    ? COLORS.primary
                    : colors.card,
                  borderColor: selectedChecklist?.id === checklist.id
                    ? COLORS.primary
                    : colors.border,
                },
              ]}
              onPress={() => setSelectedChecklist(checklist)}
            >
              <Ionicons
                name={getChecklistIcon(checklist.type) as any}
                size={16}
                color={selectedChecklist?.id === checklist.id ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.checklistChipText,
                  {
                    color: selectedChecklist?.id === checklist.id ? '#fff' : colors.text,
                  },
                ]}
              >
                {checklist.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Selected Checklist Preview */}
        {selectedChecklist && (
          <View style={[
            styles.previewCard,
            { backgroundColor: colors.card },
            SHADOWS.small,
          ]}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              {selectedChecklist.name}
            </Text>
            <Text style={[styles.previewItems, { color: colors.textSecondary }]}>
              {selectedChecklist.items.map(i => i.name).join(' \u2022 ')}
            </Text>
            <Text style={[styles.previewCount, { color: COLORS.primary }]}>
              {t('home.itemsToCheck', { count: selectedChecklist.items.length })}
            </Text>
          </View>
        )}
        
        {/* Main Exit Button */}
        <View style={styles.exitButtonContainer}>
          <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExitMode}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              activeOpacity={1}
            >
              <Ionicons name="exit" size={40} color="#fff" />
              <Text style={styles.exitButtonText}>{t('home.imLeaving')}</Text>
              <Text style={styles.exitButtonSubtext}>{t('home.tapToCheck')}</Text>
            </TouchableOpacity>
          </Animated.View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONTS.sizes.sm,
  },
  name: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.streak + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  streakText: {
    color: COLORS.streak,
    fontWeight: 'bold',
    fontSize: FONTS.sizes.md,
    marginLeft: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  riskCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  riskTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  riskValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  riskBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  riskFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  riskMessage: {
    fontSize: FONTS.sizes.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  checklistScroll: {
    marginBottom: SPACING.md,
  },
  checklistScrollContent: {
    paddingRight: SPACING.lg,
  },
  checklistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
  },
  checklistChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  previewCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
  },
  previewTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  previewItems: {
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xs,
  },
  previewCount: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  exitButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
  },
  exitButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
  exitButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
});
