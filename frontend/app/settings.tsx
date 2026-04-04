import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, ThemeMode, Language } from '../src/store/settingsStore';
import { useAuthStore } from '../src/store/authStore';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { LANGUAGES } from '../src/i18n';
import { Button } from '../src/components/Button';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const {
    theme,
    language,
    voiceEnabled,
    notificationsEnabled,
    geofencingEnabled,
    smartSuggestionsEnabled,
    setTheme,
    setLanguage,
    setVoiceEnabled,
    setNotificationsEnabled,
    setGeofencingEnabled,
    setSmartSuggestionsEnabled,
  } = useSettingsStore();
  
  const { isPremiumUser } = useAuthStore();
  const isPremium = isPremiumUser();
  
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: t('settings.light'), icon: 'sunny' },
    { value: 'dark', label: t('settings.dark'), icon: 'moon' },
    { value: 'system', label: t('settings.system'), icon: 'phone-portrait' },
  ];
  
  const currentTheme = themeOptions.find(opt => opt.value === theme);
  const currentLanguage = LANGUAGES.find(lang => lang.code === language);
  
  const handleThemeChange = async (newTheme: ThemeMode) => {
    await setTheme(newTheme);
    setShowThemeModal(false);
  };
  
  const handleLanguageChange = async (newLanguage: Language) => {
    await setLanguage(newLanguage);
    setShowLanguageModal(false);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('settings.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.appearance')}
        </Text>
        <View style={[
          styles.card,
          { backgroundColor: colors.card },
          SHADOWS.small,
        ]}>
          {/* Theme */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowThemeModal(true)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="color-palette" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.theme')}
                </Text>
                <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                  {currentTheme?.label}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          {/* Language */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="language" size={20} color={COLORS.success} />
              </View>
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.language')}
                </Text>
                <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                  {currentLanguage?.flag} {currentLanguage?.nativeName}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.notifications')}
        </Text>
        <View style={[
          styles.card,
          { backgroundColor: colors.card },
          SHADOWS.small,
        ]}>
          {/* Voice Reminders */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setVoiceEnabled(!voiceEnabled)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="volume-high" size={20} color={COLORS.warning} />
              </View>
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.voiceReminders')}
                </Text>
                <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                  {t('settings.voiceRemindersDesc')}
                </Text>
              </View>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: voiceEnabled ? COLORS.success : colors.border },
            ]}>
              <View style={[
                styles.toggleKnob,
                { transform: [{ translateX: voiceEnabled ? 20 : 0 }] },
              ]} />
            </View>
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="notifications" size={20} color={COLORS.error} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('settings.notifications')}
              </Text>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: notificationsEnabled ? COLORS.success : colors.border },
            ]}>
              <View style={[
                styles.toggleKnob,
                { transform: [{ translateX: notificationsEnabled ? 20 : 0 }] },
              ]} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Premium Features Section */}
        {isPremium && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Premium Features
            </Text>
            <View style={[
              styles.card,
              { backgroundColor: colors.card, borderWidth: 1, borderColor: COLORS.premium + '20' },
              SHADOWS.small,
            ]}>
              {/* Background Geofencing */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setGeofencingEnabled(!geofencingEnabled)}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '20' }]}>
                    <Ionicons name="navigate-circle" size={20} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={[styles.menuText, { color: colors.text }]}>
                      Background Geofencing
                    </Text>
                    <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                      Auto-remind when leaving locations
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggle,
                  { backgroundColor: geofencingEnabled ? COLORS.success : colors.border },
                ]}>
                  <View style={[
                    styles.toggleKnob,
                    { transform: [{ translateX: geofencingEnabled ? 20 : 0 }] },
                  ]} />
                </View>
              </TouchableOpacity>
              
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              
              {/* Smart Suggestions */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setSmartSuggestionsEnabled(!smartSuggestionsEnabled)}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#F59E0B20' }]}>
                    <Ionicons name="sparkles" size={20} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={[styles.menuText, { color: colors.text }]}>
                      Smart Suggestions
                    </Text>
                    <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                      AI-powered checklist recommendations
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggle,
                  { backgroundColor: smartSuggestionsEnabled ? COLORS.success : colors.border },
                ]}>
                  <View style={[
                    styles.toggleKnob,
                    { transform: [{ translateX: smartSuggestionsEnabled ? 20 : 0 }] },
                  ]} />
                </View>
              </TouchableOpacity>
              
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              
              {/* Advanced Analytics */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/stats')}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: COLORS.premium + '20' }]}>
                    <Ionicons name="analytics" size={20} color={COLORS.premium} />
                  </View>
                  <View>
                    <Text style={[styles.menuText, { color: colors.text }]}>
                      Advanced Analytics
                    </Text>
                    <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                      Trends, patterns & detailed insights
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.about')}
        </Text>
        <View style={[
          styles.card,
          { backgroundColor: colors.card },
        ]}>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { opacity: 0.6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderless: false }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              Alert.alert(
                'Privacy Policy',
                'Forgetly respects your privacy. Your data is stored locally on your device and securely in the cloud. We do not sell or share your personal information with third parties.\n\nData collected:\n• Account info (email)\n• Checklists and items\n• Location data (with permission)\n\nYou can delete your account and all data at any time.\n\nContact: Contact@frestvia.store',
                [
                  { text: 'Email Us', onPress: () => Linking.openURL('mailto:Contact@frestvia.store?subject=Privacy%20Inquiry').catch(() => {}) },
                  { text: 'OK' },
                ]
              );
            }}
          >
            <View style={styles.menuLeft} pointerEvents="none">
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('settings.privacyPolicy')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { opacity: 0.6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderless: false }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              Alert.alert(
                'Terms of Service',
                'By using Forgetly, you agree to the following:\n\n1. You must be 13+ years old to use this app.\n2. You are responsible for your account security.\n3. Do not use the app for unlawful purposes.\n4. We may update these terms with notice.\n5. Premium subscriptions are non-refundable after 7 days.\n\nForgetly is provided "as-is" without warranty.',
                [{ text: 'OK' }]
              );
            }}
          >
            <View style={styles.menuLeft} pointerEvents="none">
              <View style={[styles.menuIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="document-text" size={20} color={COLORS.success} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('settings.termsOfService')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { opacity: 0.6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
            android_ripple={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderless: false }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              Alert.alert(
                'Rate Forgetly',
                'Enjoying Forgetly? Your rating helps us improve and reach more people!',
                [
                  { text: 'Not Now', style: 'cancel' },
                  {
                    text: 'Rate Now',
                    onPress: () => {
                      Alert.alert('Thank you!', 'We appreciate your support!');
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.menuLeft} pointerEvents="none">
              <View style={[styles.menuIcon, { backgroundColor: COLORS.streak + '20' }]}>
                <Ionicons name="star" size={20} color={COLORS.streak} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('settings.rateApp')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        
        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.text }]}>{t('app.name')}</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            {t('profile.version')} 1.0.0
          </Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
            {t('app.tagline')}
          </Text>
        </View>
      </ScrollView>
      
      {/* Theme Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.theme')}
            </Text>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  theme === option.value && { backgroundColor: COLORS.primary + '20' },
                ]}
                onPress={() => handleThemeChange(option.value)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={theme === option.value ? COLORS.primary : colors.text}
                />
                <Text style={[
                  styles.modalOptionText,
                  { color: theme === option.value ? COLORS.primary : colors.text },
                ]}>
                  {option.label}
                </Text>
                {theme === option.value && (
                  <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '75%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalOption,
                  language === lang.code && { backgroundColor: COLORS.primary + '20' },
                ]}
                onPress={() => handleLanguageChange(lang.code as Language)}
              >
                <Text style={styles.flagEmoji}>{lang.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.modalOptionText,
                    { color: language === lang.code ? COLORS.primary : colors.text },
                  ]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={[styles.languageSubtext, { color: colors.textSecondary }]}>
                    {lang.name}
                  </Text>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: RADIUS.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: 56,
    zIndex: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuText: {
    fontSize: FONTS.sizes.md,
  },
  menuSubtext: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginLeft: 64,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },
  appName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  appVersion: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  appTagline: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  modalOptionText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    marginLeft: SPACING.md,
  },
  flagEmoji: {
    fontSize: 28,
  },
  languageInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  languageSubtext: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
});
