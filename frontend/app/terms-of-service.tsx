import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, COLORS, SPACING } from '../src/constants/theme';

const SUPPORT_EMAIL = 'Contact@frestvia.store';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Forgetly Terms Inquiry')}`).catch(() => {});
  };

  const Section = ({ title, children }: { title: string; children: string }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.badge, { backgroundColor: COLORS.success + '15' }]}>
          <Ionicons name="document-text" size={20} color={COLORS.success} />
          <Text style={[styles.badgeText, { color: COLORS.success }]}>Effective: June 2025</Text>
        </View>

        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Welcome to Forgetly. By downloading, installing, or using our application, you agree to be bound by these Terms of Service. Please read them carefully.
        </Text>

        <Section title="1. Acceptance of Terms">
{'By creating an account or using Forgetly, you confirm that you are at least 13 years old and agree to comply with these Terms. If you do not agree, please do not use the app.'}
        </Section>

        <Section title="2. Account Responsibilities">
{'\u2022 You are responsible for maintaining the confidentiality of your account credentials.\n\u2022 You must provide accurate and complete information when registering.\n\u2022 You are responsible for all activities that occur under your account.\n\u2022 Notify us immediately of any unauthorized use of your account.'}
        </Section>

        <Section title="3. Acceptable Use">
{'You agree NOT to:\n\n\u2022 Use the app for any unlawful or fraudulent purpose\n\u2022 Attempt to reverse engineer, decompile, or hack the application\n\u2022 Interfere with or disrupt the app or its servers\n\u2022 Share your account credentials with others\n\u2022 Upload malicious content or spam through shared lists'}
        </Section>

        <Section title="4. Premium Subscription">
{'\u2022 Premium features require an active subscription.\n\u2022 Subscriptions are billed according to the plan selected.\n\u2022 You may cancel your subscription at any time through your device settings.\n\u2022 Refunds are available within 7 days of purchase if you are unsatisfied.\n\u2022 Premium features will be disabled upon subscription expiry.'}
        </Section>

        <Section title="5. Shared Lists">
{'\u2022 By sharing a list, you grant other members access to view and edit items.\n\u2022 You are responsible for the content you add to shared lists.\n\u2022 We reserve the right to remove content that violates these terms.\n\u2022 Shared list owners can remove members at any time.'}
        </Section>

        <Section title="6. Intellectual Property">
{'All content, features, and functionality of Forgetly are owned by us and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of the app without our written consent.'}
        </Section>

        <Section title="7. Limitation of Liability">
{'Forgetly is provided "as-is" without warranty of any kind. We are not liable for:\n\n\u2022 Any missed reminders or forgotten items\n\u2022 Data loss due to device failure or connectivity issues\n\u2022 Any indirect, incidental, or consequential damages\n\u2022 Actions taken based on Smart Suggestions'}
        </Section>

        <Section title="8. Termination">
{'We reserve the right to suspend or terminate your account if you violate these Terms. Upon termination, your right to use the app ceases immediately. You may request deletion of your data at any time.'}
        </Section>

        <Section title="9. Changes to Terms">
{'We may modify these Terms at any time. Continued use of the app after changes constitutes acceptance of the updated Terms. We will notify you of significant changes through the app.'}
        </Section>

        <View style={[styles.contactCard, {
          backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : COLORS.success + '06',
          borderColor: isDark ? 'rgba(16,185,129,0.15)' : COLORS.success + '15',
        }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>Questions about these terms?</Text>
          <Text style={[styles.contactBody, { color: colors.textSecondary }]}>
            Contact us at:
          </Text>
          <TouchableOpacity
            onPress={openEmail}
            activeOpacity={0.7}
            style={styles.emailBtn}
          >
            <Ionicons name="mail" size={16} color={COLORS.primary} />
            <Text style={[styles.emailText, { color: COLORS.primary }]}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  contactBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
