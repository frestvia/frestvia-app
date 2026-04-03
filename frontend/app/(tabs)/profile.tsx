import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useStatsStore } from '../../src/store/statsStore';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { user, logout, updateProfile } = useAuthStore();
  const { stats } = useStatsStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };
  
  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
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
          <Text style={[styles.name, { color: isDark ? COLORS.textDark : COLORS.text }]}>
            {user?.name || 'Guest User'}
          </Text>
          <Text style={[styles.email, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            {user?.is_guest ? 'Guest Account' : user?.email}
          </Text>
          {user?.is_guest && (
            <View style={styles.guestBadge}>
              <Ionicons name="person-outline" size={14} color={COLORS.warning} />
              <Text style={styles.guestText}>Limited Features</Text>
            </View>
          )}
        </View>
        
        {/* Stats Summary */}
        <View style={[
          styles.statsCard,
          { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
          SHADOWS.small,
        ]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: isDark ? COLORS.textDark : COLORS.text }]}>
              {stats?.total_exits || 0}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
              Total Exits
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {stats?.total_items_checked || 0}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
              Items Saved
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.streak }]}>
              {stats?.current_streak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
              Day Streak
            </Text>
          </View>
        </View>
        
        {/* Premium Card */}
        {!user?.is_premium && (
          <TouchableOpacity
            style={[styles.premiumCard, SHADOWS.medium]}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.9}
          >
            <View style={styles.premiumContent}>
              <Ionicons name="diamond" size={32} color="#fff" />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlimited locations, advanced insights & more
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Menu Options */}
        <View style={[
          styles.menuCard,
          { backgroundColor: isDark ? COLORS.cardDark : COLORS.card },
          SHADOWS.small,
        ]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/share-card')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="share-social" size={20} color={COLORS.primary} />
              </View>
              <Text style={[styles.menuText, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                Share My Stats
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="notifications" size={20} color={COLORS.success} />
              </View>
              <Text style={[styles.menuText, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: isDark ? COLORS.borderDark : COLORS.border }]} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="help-circle" size={20} color={COLORS.warning} />
              </View>
              <Text style={[styles.menuText, { color: isDark ? COLORS.textDark : COLORS.text }]}>
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutBtn}
          icon={<Ionicons name="log-out" size={20} color="#fff" />}
        />
        
        {/* Version */}
        <Text style={[styles.version, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: isDark ? COLORS.textDark : COLORS.text }]}>
              Edit Profile
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background,
                  color: isDark ? COLORS.textDark : COLORS.text,
                },
              ]}
              placeholder="Your name"
              placeholderTextColor={COLORS.textSecondary}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowEditModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title="Save"
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
    paddingBottom: SPACING.xxl,
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
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.premium,
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
    marginBottom: SPACING.md,
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
