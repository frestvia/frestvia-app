import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';

const FAQ_DATA = [
  {
    question: 'How do I create a checklist?',
    answer: 'Go to the Checklists tab, tap the "+" button, give your checklist a name, and start adding items. You can have up to 3 checklists on the free plan, or unlimited with Premium.',
    icon: 'list-outline',
  },
  {
    question: 'How does "I\'M LEAVING" work?',
    answer: 'Select a checklist on the Home screen and tap "I\'M LEAVING." This enters Exit Mode where you check off each item you have with you. Any unchecked items will be spoken aloud as reminders!',
    icon: 'exit-outline',
  },
  {
    question: 'What does Premium include?',
    answer: 'Premium unlocks: Unlimited checklists & locations, Advanced Analytics & Insights, Smart Suggestions, Background Geofencing, Shared Lists, and priority support.',
    icon: 'diamond-outline',
  },
  {
    question: 'How do I share a list with someone?',
    answer: 'Go to Shared Lists (Premium required). Create a list, then share the unique 6-digit code with others. They can join using the code to collaborate on items together.',
    icon: 'share-outline',
  },
  {
    question: 'What is Background Geofencing?',
    answer: 'A Premium feature that monitors your saved locations. When you leave a location, it automatically triggers a reminder to check your items. Enable it in Settings > Premium Features.',
    icon: 'navigate-circle-outline',
  },
  {
    question: 'How do I reset my password?',
    answer: 'On the Login screen, tap "Forgot Password?" Enter your email to receive a 6-digit reset code. Enter the code and set a new password (min 8 characters with a letter and number).',
    icon: 'key-outline',
  },
  {
    question: 'Voice reminders aren\'t working',
    answer: 'Make sure Voice Reminders is turned on in Settings > Notifications. Also check your device volume is up. The voice reads forgotten items when you finish Exit Mode.',
    icon: 'volume-high-outline',
  },
  {
    question: 'How do I change the app language?',
    answer: 'Go to Settings > Appearance > Language. We support 15 languages including English, Spanish, French, German, Japanese, and more.',
    icon: 'language-outline',
  },
];

function FAQItem({ item, isDark, colors }: { item: typeof FAQ_DATA[0]; isDark: boolean; colors: any }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.faqItem,
          pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' },
        ]}
        onPress={toggleExpand}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
      >
        <View style={[styles.faqIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
        </View>
        <Text style={[styles.faqQuestion, { color: colors.text }]} numberOfLines={2}>
          {item.question}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Animated.View>
      </Pressable>
      {expanded && (
        <View style={[styles.faqAnswer, { 
          backgroundColor: isDark ? 'rgba(99,102,241,0.06)' : COLORS.primary + '06',
          borderLeftColor: COLORS.primary,
        }]}>
          <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card }]}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Chat Support Card */}
        <Pressable
          style={({ pressed }) => [
            styles.chatCard,
            {
              backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : COLORS.primary + '08',
              borderColor: isDark ? 'rgba(99,102,241,0.25)' : COLORS.primary + '20',
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={() => router.push('/support-chat')}
          android_ripple={{ color: COLORS.primary + '20' }}
        >
          <View style={[styles.chatIconCircle, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="chatbubbles" size={28} color="#fff" />
          </View>
          <View style={styles.chatCardContent}>
            <Text style={[styles.chatCardTitle, { color: colors.text }]}>
              Chat with AI Support
            </Text>
            <Text style={[styles.chatCardDesc, { color: colors.textSecondary }]}>
              Get instant help from our AI assistant. Available 24/7 for any questions about Forgetly.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </Pressable>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Frequently Asked Questions
        </Text>
        <View style={[styles.faqCard, { backgroundColor: colors.card }]}>
          {FAQ_DATA.map((item, index) => (
            <View key={index}>
              {index > 0 && (
                <View style={[styles.faqDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]} />
              )}
              <FAQItem item={item} isDark={isDark} colors={colors} />
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Need More Help?
        </Text>
        <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
          <Pressable
            style={({ pressed }) => [
              styles.contactRow,
              pressed && { opacity: 0.7, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
            ]}
            onPress={() => router.push('/support-chat')}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          >
            <View style={[styles.contactIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Live Chat</Text>
              <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>
                Chat with our AI support now
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.faqDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]} />

          <Pressable
            style={({ pressed }) => [
              styles.contactRow,
              pressed && { opacity: 0.7, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
            ]}
            onPress={() => {
              Linking.openURL('mailto:Contact@frestvia.store?subject=Forgetly%20Support%20Request');
            }}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          >
            <View style={[styles.contactIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="mail" size={20} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Email Support</Text>
              <Text style={[styles.contactDesc, { color: COLORS.primary }]}>
                Contact@frestvia.store
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.faqDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]} />

          <Pressable
            style={({ pressed }) => [
              styles.contactRow,
              pressed && { opacity: 0.7, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
            ]}
            onPress={() => {
              Linking.openURL('mailto:Contact@frestvia.store?subject=Forgetly%20Bug%20Report');
            }}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          >
            <View style={[styles.contactIcon, { backgroundColor: COLORS.error + '15' }]}>
              <Ionicons name="bug" size={20} color={COLORS.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Report a Bug</Text>
              <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>
                Help us improve Forgetly
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* App Version */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Forgetly v1.0.0
          </Text>
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
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },
  chatIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatCardContent: { flex: 1 },
  chatCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  chatCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  faqCard: {
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    minHeight: 56,
  },
  faqIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  faqDivider: {
    height: 1,
    marginLeft: 60,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    minHeight: 56,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
  },
});
