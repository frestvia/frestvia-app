import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
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
  withSequence,
  Easing,
  interpolate,
  useAnimatedProps,
} from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { useChecklistStore, Checklist } from '../../src/store/checklistStore';
import { useStatsStore } from '../../src/store/statsStore';
import { useLocationStore } from '../../src/store/locationStore';
import { useSharedListStore } from '../../src/store/sharedListStore';
import { useLocation } from '../../src/hooks/useLocation';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_SIZE = 160;
const PULSE_SIZE = 200;

// Glass card colors for dark theme
const GLASS = {
  bg: 'rgba(22, 27, 48, 0.75)',
  bgLight: 'rgba(255, 255, 255, 0.04)',
  border: 'rgba(99, 102, 241, 0.15)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  highlight: 'rgba(99, 102, 241, 0.08)',
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  
  const { user } = useAuthStore();
  const { checklists, fetchChecklists, setActiveChecklist } = useChecklistStore();
  const { stats, fetchStats } = useStatsStore();
  const { locations, fetchLocations, nearbyLocation } = useLocationStore();
  const { lists: sharedLists, fetchLists: fetchSharedLists } = useSharedListStore();
  const { getCurrentPosition } = useLocation();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [promoDismissed, setPromoDismissed] = useState(false);
  
  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);
  const glowOpacity = useSharedValue(0.3);
  
  useEffect(() => {
    fetchChecklists();
    fetchStats();
    fetchLocations();
    fetchSharedLists();
    getCurrentPosition().catch(() => {});
    
    // Pulse animation for the main CTA
    pulseScale.value = withRepeat(
      withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
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
    await Promise.all([fetchChecklists(), fetchStats(), fetchLocations(), fetchSharedLists()]);
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
  
  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));
  
  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };
  
  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };
  
  const getChecklistIcon = (type: string) => {
    switch (type) {
      case 'home': return 'home';
      case 'travel': return 'airplane';
      case 'office': return 'briefcase';
      default: return 'list';
    }
  };

  // Use glass styling for dark, clean cards for light
  const cardBg = isDark ? GLASS.bg : colors.card;
  const cardBorder = isDark ? GLASS.border : colors.border;
  const subtleBorder = isDark ? GLASS.borderSubtle : colors.border;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Compact Stats Row */}
        {stats && (
          <View style={styles.compactStatsRow}>
            <View style={[styles.miniStatCard, { 
              backgroundColor: cardBg, 
              borderColor: subtleBorder,
              borderWidth: isDark ? 1 : 0,
            }, !isDark && SHADOWS.small]}>
              <View style={[styles.miniStatIconWrap, { backgroundColor: COLORS.success + '18' }]}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
              <View>
                <Text style={[styles.miniStatValue, { color: colors.text }]}>
                  {stats.items_saved_today || 0}
                </Text>
                <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>
                  {t('home.itemsSaved')}
                </Text>
              </View>
            </View>
            
            <View style={[styles.miniStatCard, { 
              backgroundColor: cardBg, 
              borderColor: subtleBorder,
              borderWidth: isDark ? 1 : 0,
            }, !isDark && SHADOWS.small]}>
              <View style={[styles.miniStatIconWrap, { backgroundColor: COLORS.error + '18' }]}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              </View>
              <View>
                <Text style={[styles.miniStatValue, { color: colors.text }]}>
                  {stats.items_forgotten_today || 0}
                </Text>
                <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>
                  {t('home.forgotten')}
                </Text>
              </View>
            </View>

            {stats.current_streak > 0 && (
              <View style={[styles.miniStatCard, { 
                backgroundColor: cardBg, 
                borderColor: COLORS.streak + '30',
                borderWidth: isDark ? 1 : 0,
              }, !isDark && SHADOWS.small]}>
                <View style={[styles.miniStatIconWrap, { backgroundColor: COLORS.streak + '18' }]}>
                  <Ionicons name="flame" size={18} color={COLORS.streak} />
                </View>
                <View>
                  <Text style={[styles.miniStatValue, { color: COLORS.streak }]}>
                    {stats.current_streak}
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>
                    Streak
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Section: Select Checklist */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.selectChecklist')}
        </Text>
        
        {/* Checklist Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {checklists.map((checklist) => {
            const isActive = selectedChecklist?.id === checklist.id;
            return (
              <TouchableOpacity
                key={checklist.id}
                onPress={() => setSelectedChecklist(checklist)}
                activeOpacity={0.8}
                style={styles.tabWrapper}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.tabPill, styles.tabPillActive]}
                  >
                    <Ionicons
                      name={getChecklistIcon(checklist.type) as any}
                      size={15}
                      color="#fff"
                    />
                    <Text style={styles.tabTextActive}>{checklist.name}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.tabPill, styles.tabPillInactive, {
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.card,
                  }]}>
                    <Ionicons
                      name={getChecklistIcon(checklist.type) as any}
                      size={15}
                      color={isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary}
                    />
                    <Text style={[styles.tabTextInactive, { 
                      color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary 
                    }]}>
                      {checklist.name}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Checklist Preview Card (Glass) */}
        {selectedChecklist && (
          <View style={[styles.glassCard, {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: isDark ? 1 : 0,
          }, !isDark && SHADOWS.small]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                {selectedChecklist.name}
              </Text>
            </View>
            <Text style={[styles.previewItems, { color: colors.textSecondary }]} numberOfLines={2}>
              {selectedChecklist.items.map(i => i.name).join(' · ')}
            </Text>
            <Text style={[styles.previewCount, { color: COLORS.primary }]}>
              {t('home.itemsToCheck', { count: selectedChecklist.items.length })}
            </Text>
          </View>
        )}
        
        {/* Main CTA: I'M LEAVING Button */}
        <View style={styles.ctaContainer}>
          {/* Outer glow ring */}
          <Animated.View style={[styles.outerGlow, outerGlowStyle]} />
          
          {/* Pulse ring */}
          <Animated.View style={[styles.pulseRing, pulseRingStyle]} />
          
          {/* Main Button */}
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              onPress={handleExitMode}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              activeOpacity={1}
              style={styles.ctaButtonOuter}
            >
              <LinearGradient
                colors={['#7C3AED', '#6366F1', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaButton}
              >
                <View style={styles.ctaInnerShadow}>
                  <Ionicons name="exit-outline" size={36} color="#fff" />
                  <Text style={styles.ctaText}>{t('home.imLeaving')}</Text>
                  <Text style={styles.ctaSubtext}>{t('home.tapToCheck')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Shared Lists Card (Glass) */}
        <TouchableOpacity
          style={[styles.glassCard, styles.sharedListCard, {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: isDark ? 1 : 0,
          }, !isDark && SHADOWS.small]}
          onPress={() => router.push('/shared-lists')}
          activeOpacity={0.7}
        >
          <View style={[styles.sharedListIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : COLORS.success + '15' }]}>
            <Ionicons name="people" size={20} color={COLORS.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sharedListTitle, { color: colors.text }]}>
              Shared Lists
            </Text>
            <Text style={[styles.sharedListSub, { color: colors.textSecondary }]}>
              Share checklists with family & friends
            </Text>
          </View>
          {sharedLists.length > 0 && (
            <View style={styles.sharedBadge}>
              <Text style={styles.sharedBadgeText}>{sharedLists.length}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(255,255,255,0.3)' : colors.textSecondary} />
        </TouchableOpacity>

        {/* Locations Quick Access */}
        <TouchableOpacity
          style={[styles.glassCard, styles.sharedListCard, {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: isDark ? 1 : 0,
          }, !isDark && SHADOWS.small]}
          onPress={() => router.push('/locations')}
          activeOpacity={0.7}
        >
          <View style={[styles.sharedListIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : COLORS.primary + '15' }]}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sharedListTitle, { color: colors.text }]}>
              {t('home.myLocations')}
            </Text>
            <Text style={[styles.sharedListSub, { color: colors.textSecondary }]}>
              Location-based reminders
            </Text>
          </View>
          <View style={[styles.sharedBadge, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.sharedBadgeText}>{locations.length}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(255,255,255,0.3)' : colors.textSecondary} />
        </TouchableOpacity>

        {/* Nearby Location Alert */}
        {nearbyLocation && (
          <View style={[styles.nearbyCard, {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : COLORS.success + '10',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : COLORS.success + '30',
            borderWidth: 1,
          }]}>
            <Ionicons name="location" size={18} color={COLORS.success} />
            <View style={styles.nearbyInfo}>
              <Text style={[styles.nearbyLabel, { color: COLORS.success }]}>
                {t('home.nearLocation')}
              </Text>
              <Text style={[styles.nearbyName, { color: colors.text }]}>
                {nearbyLocation.name}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          </View>
        )}

        {/* Premium Promo Card */}
        {!user?.is_premium && !promoDismissed && (
          <View style={[styles.promoCard, isDark && { borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <LinearGradient
              colors={isDark ? ['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.15)'] : ['#6366F1', '#8B5CF6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoGradient}
            >
              <TouchableOpacity
                style={styles.promoDismiss}
                onPress={() => setPromoDismissed(true)}
              >
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              
              <View style={styles.promoContent}>
                <View style={styles.promoIconRow}>
                  <Ionicons name="diamond" size={24} color={isDark ? COLORS.primary : '#fff'} />
                  <View style={styles.promoFeatures}>
                    <View style={[styles.promoFeatureTag, isDark && { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                      <Ionicons name="location" size={10} color={isDark ? COLORS.primary : '#fff'} />
                      <Text style={[styles.promoFeatureText, isDark && { color: COLORS.primaryLight }]}>Unlimited</Text>
                    </View>
                    <View style={[styles.promoFeatureTag, isDark && { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                      <Ionicons name="notifications" size={10} color={isDark ? COLORS.primary : '#fff'} />
                      <Text style={[styles.promoFeatureText, isDark && { color: COLORS.primaryLight }]}>Smart</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={[styles.promoTitle, isDark && { color: '#E0E0FF' }]}>
                  Unlock Full Power
                </Text>
                <Text style={[styles.promoSubtitle, isDark && { color: 'rgba(224, 224, 255, 0.6)' }]}>
                  Unlimited locations, smart reminders, and advanced insights.
                </Text>
                
                <TouchableOpacity
                  style={[styles.promoCTA, isDark && { backgroundColor: COLORS.primary }]}
                  onPress={() => router.push('/paywall')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="star" size={16} color={isDark ? '#fff' : '#6366F1'} />
                  <Text style={[styles.promoCTAText, isDark && { color: '#fff' }]}>
                    Upgrade to Premium
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}
        
        {/* Bottom spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  
  // ── Compact Stats Row ────────────────────
  compactStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  miniStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  miniStatIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  
  // ── Section Title ────────────────────
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  
  // ── Checklist Tabs ────────────────────
  tabsScroll: {
    marginBottom: 16,
  },
  tabsContent: {
    paddingRight: 20,
    gap: 10,
  },
  tabWrapper: {},
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    gap: 8,
  },
  tabPillActive: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  tabPillInactive: {
    borderWidth: 1,
  },
  tabTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // ── Glass Card (generic) ────────────────────
  glassCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  
  // ── Checklist Preview ────────────────────
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  previewItems: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  previewCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // ── CTA Button ────────────────────
  ctaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 28,
    height: PULSE_SIZE + 20,
  },
  outerGlow: {
    position: 'absolute',
    width: PULSE_SIZE + 30,
    height: PULSE_SIZE + 30,
    borderRadius: (PULSE_SIZE + 30) / 2,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  ctaButtonOuter: {
    borderRadius: BUTTON_SIZE / 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    aspectRatio: 1,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaInnerShadow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ctaSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  
  // ── Shared Lists / Location Cards ────────────────────
  sharedListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sharedListIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedListTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sharedListSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sharedBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  sharedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  
  // ── Nearby Location ────────────────────
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    gap: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nearbyName: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  
  // ── Premium Promo ────────────────────
  promoCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  promoGradient: {
    padding: 20,
  },
  promoDismiss: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  promoContent: {},
  promoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  promoFeatures: {
    flexDirection: 'row',
    gap: 8,
  },
  promoFeatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  promoFeatureText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  promoSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  promoCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  promoCTAText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '700',
  },
});
