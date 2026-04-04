import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const { user, activatePremium, isPremiumUser } = useAuthStore();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  
  const isAlreadyPremium = isPremiumUser();
  
  // Animation values
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  
  const features = [
    { icon: 'location', text: 'Unlimited saved locations', color: '#8B5CF6' },
    { icon: 'analytics', text: 'Advanced insights & analytics', color: '#6366F1' },
    { icon: 'navigate', text: 'Background geofencing', color: '#7C3AED' },
    { icon: 'list', text: 'Unlimited checklists', color: '#6366F1' },
    { icon: 'bulb', text: 'Smart suggestions', color: '#8B5CF6' },
    { icon: 'people', text: 'Shared premium tools', color: '#7C3AED' },
    { icon: 'stats-chart', text: 'Premium stats & trends', color: '#6366F1' },
    { icon: 'mic', text: 'Custom voice alerts', color: '#8B5CF6' },
  ];
  
  const handlePurchase = async () => {
    if (isAlreadyPremium) {
      router.back();
      return;
    }
    
    if (user?.is_guest) {
      Alert.alert(
        'Account Required',
        'Please create an account to purchase premium. Guest accounts cannot make purchases.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.replace('/(auth)/signup') },
        ]
      );
      return;
    }
    
    setLoading(true);
    try {
      console.log('[Paywall] Starting purchase...');
      
      // Activate premium through the store (handles backend + local + state)
      await activatePremium();
      
      console.log('[Paywall] Purchase success! Showing animation...');
      
      // Show success animation
      setPurchaseSuccess(true);
      successOpacity.value = withTiming(1, { duration: 300 });
      successScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      checkScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 150 }));
      
      // Auto-close after showing success
      setTimeout(() => {
        router.back();
      }, 2500);
      
    } catch (error: any) {
      console.error('[Paywall] Purchase failed:', error);
      Alert.alert(
        'Purchase Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleRestore = async () => {
    setRestoring(true);
    try {
      console.log('[Paywall] Restoring purchases...');
      
      // In a real app, this would check App Store/Play Store receipts
      // For now, check backend status
      await activatePremium();
      
      setPurchaseSuccess(true);
      successOpacity.value = withTiming(1, { duration: 300 });
      successScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      checkScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 150 }));
      
      setTimeout(() => {
        router.back();
      }, 2500);
      
    } catch (error: any) {
      Alert.alert('Restore Failed', 'No active subscription found.');
    } finally {
      setRestoring(false);
    }
  };
  
  const successAnimStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));
  
  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  
  // Success overlay
  if (purchaseSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successOverlay}>
          <Animated.View style={[styles.successContent, successAnimStyle]}>
            <Animated.View style={[styles.successCheckWrap, checkAnimStyle]}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successCheckCircle}
              >
                <Ionicons name="checkmark" size={48} color="#fff" />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Premium Activated!
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              All features are now unlocked. Enjoy Forgetly Premium!
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }
  
  // Already premium state
  if (isAlreadyPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.alreadyPremiumWrap}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.premiumActiveCircle}
          >
            <Ionicons name="diamond" size={48} color="#fff" />
          </LinearGradient>
          <Text style={[styles.alreadyPremiumTitle, { color: colors.text }]}>
            You are Premium!
          </Text>
          <Text style={[styles.alreadyPremiumSub, { color: colors.textSecondary }]}>
            All features are unlocked. Thank you for your support!
          </Text>
          <View style={[styles.activeFeaturesCard, { backgroundColor: colors.card }]}>
            {features.slice(0, 4).map((f, i) => (
              <View key={i} style={styles.activeFeatureRow}>
                <Ionicons name={f.icon as any} size={18} color={COLORS.success} />
                <Text style={[styles.activeFeatureText, { color: colors.text }]}>{f.text}</Text>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backHomeBtnText}>Back to App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.premiumIcon}>
            <Ionicons name="diamond" size={48} color="#fff" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Upgrade to Premium
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Never forget anything, anywhere
          </Text>
        </View>
        
        {/* Features */}
        <View style={[
          styles.featuresCard,
          { backgroundColor: colors.card },
          SHADOWS.small,
        ]}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureItem,
                index < features.length - 1 && styles.featureItemBorder,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={20} color={feature.color} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature.text}
              </Text>
              <Ionicons name="checkmark" size={20} color={COLORS.success} />
            </View>
          ))}
        </View>

        {/* Guest Warning */}
        {user?.is_guest && (
          <View style={[styles.guestWarning, { backgroundColor: COLORS.warning + '15', borderColor: COLORS.warning + '30' }]}>
            <Ionicons name="information-circle" size={20} color={COLORS.warning} />
            <Text style={[styles.guestWarningText, { color: colors.text }]}>
              Create an account to purchase premium
            </Text>
          </View>
        )}
        
        {/* Pricing - Only show for non-guest */}
        {!user?.is_guest && (
          <>
            <Text style={[styles.pricingTitle, { color: colors.text }]}>
              Choose your plan
            </Text>
            
            <View style={styles.plans}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  { backgroundColor: colors.card },
                  selectedPlan === 'monthly' && styles.planCardSelected,
                  SHADOWS.small,
                ]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>Monthly</Text>
                  {selectedPlan === 'monthly' && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.planPrice}>
                  <Text style={[styles.planPriceValue, { color: colors.text }]}>$2.99</Text>
                  <Text style={[styles.planPricePeriod, { color: colors.textSecondary }]}>/month</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.planCard,
                  { backgroundColor: colors.card },
                  selectedPlan === 'yearly' && styles.planCardSelected,
                  SHADOWS.small,
                ]}
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.8}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SAVE 44%</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>Yearly</Text>
                  {selectedPlan === 'yearly' && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.planPrice}>
                  <Text style={[styles.planPriceValue, { color: colors.text }]}>$19.99</Text>
                  <Text style={[styles.planPricePeriod, { color: colors.textSecondary }]}>/year</Text>
                </View>
                <Text style={[styles.planMonthly, { color: COLORS.success }]}>$1.67/month</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
          activeOpacity={0.7}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={[styles.restoreText, { color: COLORS.primary }]}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Footer - NOT absolute, flex sibling */}
      <View style={[
        styles.footer,
        { backgroundColor: colors.card, borderTopColor: colors.border },
      ]}>
        <TouchableOpacity
          style={[styles.purchaseBtn, loading && { opacity: 0.7 }]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={user?.is_guest ? ['#F59E0B', '#D97706'] : ['#6366F1', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.purchaseBtnGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={user?.is_guest ? 'person-add' : 'diamond'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.purchaseBtnText}>
                  {user?.is_guest
                    ? 'Create Account to Unlock'
                    : `Start Free Trial - ${selectedPlan === 'yearly' ? '$19.99/year' : '$2.99/month'}`
                  }
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.terms, { color: colors.textSecondary }]}>
          Cancel anytime. Recurring billing.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  premiumIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.premium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
  },
  featuresCard: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  featureItemBorder: {
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  guestWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    gap: 10,
  },
  guestWarningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  pricingTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  plans: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  planCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: COLORS.primary,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  saveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  planName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPriceValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  planPricePeriod: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.xs,
  },
  planMonthly: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
  purchaseBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  purchaseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  purchaseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  terms: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
  
  // Success overlay
  successOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successContent: {
    alignItems: 'center',
  },
  successCheckWrap: {
    marginBottom: 24,
  },
  successCheckCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Already premium
  alreadyPremiumWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  premiumActiveCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alreadyPremiumTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  alreadyPremiumSub: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  activeFeaturesCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  activeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  activeFeatureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  backHomeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  backHomeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
