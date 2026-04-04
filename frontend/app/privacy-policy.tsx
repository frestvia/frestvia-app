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

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Frestvia Privacy Inquiry')}`).catch(() => {});
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.badge, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          <Text style={[styles.badgeText, { color: COLORS.primary }]}>Last updated: June 2025</Text>
        </View>

        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Frestvia ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
        </Text>

        <Section title="1. Information We Collect">
{'We collect the following types of information:\n\n\u2022 Account Information: Email address and encrypted password when you create an account.\n\n\u2022 Checklist Data: The checklists, items, and categories you create within the app.\n\n\u2022 Location Data: With your explicit permission, we access your device location to provide location-based reminders and geofencing features.\n\n\u2022 Usage Analytics: Anonymous usage data to improve the app experience (no personal data is shared).\n\n\u2022 Device Information: Device type and OS version for compatibility purposes.'}
        </Section>

        <Section title="2. How We Use Your Information">
{'Your information is used to:\n\n\u2022 Provide and maintain the Frestvia service\n\u2022 Send you location-based reminders when you leave a saved location\n\u2022 Sync your checklists across devices\n\u2022 Provide Smart Suggestions based on your patterns\n\u2022 Generate your personal analytics and insights\n\u2022 Process premium subscriptions\n\u2022 Respond to customer support requests'}
        </Section>

        <Section title="3. Permissions We Request">
{'\u2022 Location (When In Use / Always): Required for geofencing reminders. You can disable this in device settings at any time.\n\n\u2022 Notifications: To send you reminders and alerts. Optional and can be toggled in Settings.\n\n\u2022 Speech/Audio: Used for voice reminder features (text-to-speech). No audio is recorded or stored.'}
        </Section>

        <Section title="4. Data Storage & Security">
{'\u2022 Your data is stored securely using industry-standard encryption.\n\u2022 Passwords are hashed using bcrypt and never stored in plain text.\n\u2022 Checklist data is stored locally on your device and synced to our secure servers.\n\u2022 We do not sell, trade, or rent your personal information to third parties.'}
        </Section>

        <Section title="5. Third-Party Services">
{'Frestvia may use the following third-party services:\n\n\u2022 Authentication services for secure login\n\u2022 Cloud hosting for data sync\n\u2022 Analytics tools (anonymized data only)\n\nThese services have their own privacy policies and we encourage you to review them.'}
        </Section>

        <Section title="6. Your Rights">
{'You have the right to:\n\n\u2022 Access your personal data\n\u2022 Request deletion of your account and all associated data\n\u2022 Opt out of notifications and location tracking\n\u2022 Export your checklist data\n\u2022 Withdraw consent at any time'}
        </Section>

        <Section title="7. Children's Privacy">
{'Frestvia is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.'}
        </Section>

        <Section title="8. Changes to This Policy">
{'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last updated" date.'}
        </Section>

        <View style={[styles.contactCard, {
          backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : COLORS.primary + '06',
          borderColor: isDark ? 'rgba(99,102,241,0.15)' : COLORS.primary + '15',
        }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>Questions?</Text>
          <Text style={[styles.contactBody, { color: colors.textSecondary }]}>
            If you have any questions about this Privacy Policy, contact us at:
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
