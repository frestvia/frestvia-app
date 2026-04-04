import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useStatsStore } from '../src/store/statsStore';
import { useTheme, COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';

export default function ShareCardScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const { user } = useAuthStore();
  const { stats } = useStatsStore();
  const [sharing, setSharing] = useState(false);

  // ====== NATIVE SHARE - EXACTLY AS USER SPECIFIED ======
  const handleShare = async () => {
    console.log('SHARE CLICKED');

    if (sharing) return;
    setSharing(true);

    try {
      // Build share message
      let msg = "I'm using Frestvia to never forget my important items. Try it now!";

      const itemsSaved = stats?.total_items_checked || 0;
      const streak = stats?.current_streak || 0;
      const totalExits = stats?.total_exits || 0;

      if (itemsSaved > 0 || streak > 0 || totalExits > 0) {
        msg += '\n\n';
        if (itemsSaved > 0) msg += `Items Saved: ${itemsSaved}\n`;
        if (streak > 0) msg += `Day Streak: ${streak}\n`;
        if (totalExits > 0) msg += `Total Exits: ${totalExits}`;
      }

      console.log('SHARE MESSAGE:', msg);

      // ONLY native Share API - NO iframe, NO webview, NO external URL
      await Share.share({
        message: msg,
        title: 'Frestvia App',
      });

      console.log('SHARE COMPLETED');
    } catch (error: any) {
      console.log('Share error:', error);

      // Web preview fallback - show copyable message
      if (Platform.OS === 'web') {
        Alert.alert(
          'Share this message',
          "I'm using Frestvia to never forget my important items. Try it now!",
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Unable to share', 'Please try again.', [{ text: 'OK' }]);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Share Your Stats
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats Card Preview */}
      <View style={styles.cardContainer}>
        <View style={styles.shareCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles.cardAppName}>Frestvia</Text>
          </View>

          {/* User Info */}
          <View style={styles.cardUserInfo}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'G'}
              </Text>
            </View>
            <Text style={styles.cardUserName}>{user?.name || 'Guest'}</Text>
          </View>

          {/* Stats */}
          <View style={styles.cardStats}>
            <View style={styles.cardStatItem}>
              <Text style={styles.cardStatValue}>{stats?.total_items_checked || 0}</Text>
              <Text style={styles.cardStatLabel}>Items Saved</Text>
            </View>
            <View style={styles.cardStatDivider} />
            <View style={styles.cardStatItem}>
              <View style={styles.streakValue}>
                <Ionicons name="flame" size={24} color={COLORS.streak} />
                <Text style={styles.cardStatValue}>{stats?.current_streak || 0}</Text>
              </View>
              <Text style={styles.cardStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.cardStatDivider} />
            <View style={styles.cardStatItem}>
              <Text style={styles.cardStatValue}>{stats?.total_exits || 0}</Text>
              <Text style={styles.cardStatLabel}>Total Exits</Text>
            </View>
          </View>

          {/* Fun Message */}
          <View style={styles.cardMessage}>
            {stats?.total_items_forgotten && stats.total_items_forgotten > 0 ? (
              <Text style={styles.cardMessageText}>
                I almost forgot {stats.total_items_forgotten} items... but Frestvia saved me!
              </Text>
            ) : (
              <Text style={styles.cardMessageText}>
                Never forgotten a thing since using Frestvia!
              </Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>Download Frestvia and never forget anything!</Text>
          </View>
        </View>
      </View>

      {/* ====== SHARE BUTTON - Direct TouchableOpacity, no wrappers ====== */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => {
            console.log('SHARE CLICKED');
            handleShare();
          }}
          activeOpacity={0.7}
          disabled={sharing}
          style={[
            styles.shareBtn,
            { opacity: sharing ? 0.6 : 1 },
          ]}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.shareBtnText}>Share to Social</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Share your progress with friends!
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  shareCard: {
    width: 320,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardAppName: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  cardUserInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardAvatarText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardUserName: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
  cardStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  cardStatValue: {
    color: '#fff',
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  cardStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: SPACING.sm,
  },
  cardMessage: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardMessageText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardFooter: {
    alignItems: 'center',
  },
  cardFooterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONTS.sizes.xs,
  },
  actions: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.md,
    gap: 10,
    marginBottom: SPACING.md,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
  hint: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
  },
});
