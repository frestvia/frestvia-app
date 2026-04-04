import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { useStatsStore } from '../../src/store/statsStore';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  
  const { user, logout, updateProfile, isPremiumUser } = useAuthStore();
  const { stats } = useStatsStore();
  
  const isPremium = isPremiumUser();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  
  const handleLogout = async () => {
    console.log('[Logout] Starting logout...');
    try {
      await logout();
      console.log('[Logout] Auth state cleared');
    } catch (e) {
      console.error('[Logout] Error:', e);
    }
    // Navigate directly to login screen
    console.log('[Logout] Navigating to login...');
    router.replace('/(auth)/login');
  };
  
  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'G'}
              </Text>
            </View>
            {!user?.is_guest && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setEditName(user?.name || '');
                  setShowEditModal(true);
                }}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.name || t('auth.guestUser')}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {user?.is_guest ? t('auth.guestAccount') : user?.email}
          </Text>
          {user?.is_guest && (
            <View style={styles.guestBadge}>
              <Ionicons name="person-outline" size={14} color={COLORS.warning} />
              <Text style={styles.guestText}>{t('auth.limitedFeatures')}</Text>
            </View>
          )}
        </View>
        
        {/* Stats Summary */}
        <View style={[
          styles.statsCard,
          { backgroundColor: colors.card },
          SHADOWS.small,
        ]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats?.total_exits || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('stats.totalExits')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {stats?.total_items_checked || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('stats.itemsChecked')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.streak }]}>
              {stats?.current_streak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('stats.dayStreak')}
            </Text>
          </View>
        </View>
        
        {/* Premium Card */}
        {isPremium ? (
          <View style={[styles.premiumActiveCard, SHADOWS.medium]}>
            <View style={styles.premiumContent}>
              <Ionicons name="diamond" size={32} color="#fff" />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>{t('profile.premiumMember')}</Text>
                <Text style={styles.premiumSubtitle}>
                  {t('profile.premiumActive')}
                </Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.upgradeBanner, SHADOWS.medium]}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.9}
          >
            <View style={styles.upgradeBannerInner}>
              <View style={styles.upgradeLeft}>
                <View style={styles.upgradeIconWrap}>
                  <Ionicons name="lock-closed" size={20} color="#fff" />
                </View>
                <View style={styles.upgradeTextWrap}>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeSubtitle}>
                    Unlock unlimited locations, smart reminders & more
                  </Text>
                </View>
              </View>
              <View style={styles.upgradeArrow}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Menu Options */}
        <View style={[
          styles.menuCard,
          { backgroundColor: colors.card },
          SHADOWS.small,
        ]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/locations')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.error + '20' }]}>
                <Ionicons name="location" size={20} color={COLORS.error} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('locations.title')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/share-card')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="share-social" size={20} color={COLORS.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('profile.shareMyStats')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="settings" size={20} color={COLORS.success} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('profile.settings')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="help-circle" size={20} color={COLORS.warning} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t('profile.helpSupport')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutBtnText}>{t('auth.logout')}</Text>
        </Pressable>
        
        {/* Version */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          {t('app.name')} - {t('profile.version')} 1.0.0
        </Text>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('profile.editProfile')}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={t('profile.yourName')}
              placeholderTextColor={colors.textSecondary}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                onPress={() => setShowEditModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title={t('common.save')}
                onPress={handleUpdateProfile}
                loading={loading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 160,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  email: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.xs,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  guestText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    marginVertical: SPACING.xs,
  },
  premiumActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  premiumTitle: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  upgradeBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    backgroundColor: '#7C3AED',
  },
  upgradeBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  upgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  upgradeTextWrap: {
    flex: 1,
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  upgradeSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  upgradeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuCard: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  menuDivider: {
    height: 1,
    marginLeft: 64,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: SPACING.md,
    gap: 10,
  },
  logoutBtnConfirm: {
    backgroundColor: '#DC2626',
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  modalInput: {
    height: 56,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});
