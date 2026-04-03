import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { api } from '../src/services/api';
import { Button } from '../src/components/Button';

export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const { refreshUser } = useAuthStore();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  
  const features = [
    { icon: 'location', text: t('premium.unlimitedLocations') },
    { icon: 'analytics', text: t('premium.advancedInsights') },
    { icon: 'navigate', text: t('premium.backgroundGeofencing') },
    { icon: 'list', text: t('premium.unlimitedChecklists') },
    { icon: 'bulb', text: t('premium.smartSuggestions') },
    { icon: 'cloud', text: t('premium.cloudSync') },
    { icon: 'flame', text: t('premium.streakRewards') },
    { icon: 'mic', text: t('premium.customVoice') },
  ];
  
  const handlePurchase = async () => {
    setLoading(true);
    try {
      // For testing - activate premium via API
      await api.post('/premium/activate');
      await refreshUser();
      Alert.alert(
        '🎉 ' + t('common.success'),
        'Premium activated! Enjoy all features.',
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to activate premium');
    } finally {
      setLoading(false);
    }
  };
  
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
            {t('premium.title')}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {t('premium.subtitle')}
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
              <View style={[styles.featureIcon, { backgroundColor: COLORS.premium + '20' }]}>
                <Ionicons name={feature.icon as any} size={20} color={COLORS.premium} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature.text}
              </Text>
              <Ionicons name="checkmark" size={20} color={COLORS.success} />
            </View>
          ))}
        </View>
        
        {/* Pricing */}
        <Text style={[styles.pricingTitle, { color: colors.text }]}>
          {t('premium.choosePlan')}
        </Text>
        
        <View style={styles.plans}>
          {/* Monthly */}
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
              <Text style={[styles.planName, { color: colors.text }]}>
                {t('premium.monthly')}
              </Text>
              {selectedPlan === 'monthly' && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.planPrice}>
              <Text style={[styles.planPriceValue, { color: colors.text }]}>
                $2.99
              </Text>
              <Text style={[styles.planPricePeriod, { color: colors.textSecondary }]}>
                {t('premium.perMonth')}
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Yearly */}
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
              <Text style={styles.saveBadgeText}>{t('premium.save', { percent: 44 })}</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: colors.text }]}>
                {t('premium.yearly')}
              </Text>
              {selectedPlan === 'yearly' && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.planPrice}>
              <Text style={[styles.planPriceValue, { color: colors.text }]}>
                $19.99
              </Text>
              <Text style={[styles.planPricePeriod, { color: colors.textSecondary }]}>
                {t('premium.perYear')}
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
          <Text style={[styles.trialText, { color: colors.textSecondary }]}>
            {t('premium.freeTrial')}
          </Text>
        </View>
      </ScrollView>
      
      {/* Footer */}
      <View style={[
        styles.footer,
        { backgroundColor: colors.card },
        SHADOWS.medium,
      ]}>
        <Button
          title={`${t('premium.startTrial')} - ${selectedPlan === 'yearly' ? '$19.99/year' : '$2.99/month'}`}
          onPress={handlePurchase}
          loading={loading}
          size="large"
          style={styles.purchaseBtn}
        />
        <Text style={[styles.terms, { color: colors.textSecondary }]}>
          {t('premium.cancelAnytime')}
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
