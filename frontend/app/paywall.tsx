import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';

export default function PaywallScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  
  const features = [
    { icon: 'location', text: 'Unlimited saved locations' },
    { icon: 'analytics', text: 'Advanced insights & analytics' },
    { icon: 'navigate', text: 'Background geofencing' },
    { icon: 'list', text: 'Unlimited checklists' },
    { icon: 'bulb', text: 'Smart suggestions' },
    { icon: 'cloud', text: 'Cloud sync across devices' },
    { icon: 'flame', text: 'Streak rewards & badges' },
    { icon: 'mic', text: 'Custom voice alerts' },
  ];
  
  const handlePurchase = () => {
    setLoading(true);
    // Simulate purchase - in real app, integrate with RevenueCat/IAP
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Coming Soon',
        'Premium features will be available in the next update. Thank you for your interest!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={isDark ? COLORS.textDark : COLORS.text} />
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
          <Text style={[styles.heroTitle, { color: isDark ? COLORS.textDark : COLORS.text }]}>
            Upgrade to Premium
          </Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            Never forget anything, anywhere
          </Text>
        </View>
        
        {/* Features */}
        <View style={[
          styles.featuresCard,
          { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
          SHADOWS.small,
        ]}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureItem,
                index < features.length - 1 && styles.featureItemBorder,
                { borderBottomColor: isDark ? COLORS.borderDark : COLORS.border },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: COLORS.premium + '20' }]}>
                <Ionicons name={feature.icon as any} size={20} color={COLORS.premium} />
              </View>
              <Text style={[styles.featureText, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                {feature.text}
              </Text>
              <Ionicons name="checkmark" size={20} color={COLORS.success} />
            </View>
          ))}
        </View>
        
        {/* Pricing */}
        <Text style={[styles.pricingTitle, { color: isDark ? COLORS.textDark : COLORS.text }]}>
          Choose Your Plan
        </Text>
        
        <View style={styles.plans}>
          {/* Monthly */}
          <TouchableOpacity
            style={[
              styles.planCard,
              { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
              selectedPlan === 'monthly' && styles.planCardSelected,
              SHADOWS.small,
            ]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                Monthly
              </Text>
              {selectedPlan === 'monthly' && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.planPrice}>
              <Text style={[styles.planPriceValue, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                $2.99
              </Text>
              <Text style={[styles.planPricePeriod, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
                /month
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Yearly */}
          <TouchableOpacity
            style={[
              styles.planCard,
              { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
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
              <Text style={[styles.planName, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                Yearly
              </Text>
              {selectedPlan === 'yearly' && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.planPrice}>
              <Text style={[styles.planPriceValue, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                $19.99
              </Text>
              <Text style={[styles.planPricePeriod, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
                /year
              </Text>
            </View>
            <Text style={[styles.planMonthly, { color: COLORS.success }]}>
              $1.67/month
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Trial Notice */}
        <View style={styles.trialNotice}>
          <Ionicons name="gift" size={20} color={COLORS.primary} />
          <Text style={[styles.trialText, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            7-day free trial included
          </Text>
        </View>
      </ScrollView>
      
      {/* Footer */}
      <View style={[
        styles.footer,
        { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
        SHADOWS.medium,
      ]}>
        <Button
          title={selectedPlan === 'yearly' ? 'Start Free Trial - $19.99/year' : 'Start Free Trial - $2.99/month'}
          onPress={handlePurchase}
          loading={loading}
          size="large"
          style={styles.purchaseBtn}
        />
        <Text style={[styles.terms, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
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
    paddingBottom: SPACING.xxl,
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
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONTS.sizes.md,
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
  },
  pricingTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
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
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
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
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  planPricePeriod: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.xs,
  },
  planMonthly: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  trialText: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  purchaseBtn: {
    marginBottom: SPACING.sm,
  },
  terms: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
});
