import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useAuthStore } from '../src/store/authStore';
import { useStatsStore } from '../src/store/statsStore';
import { Button } from '../src/components/Button';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';

export default function ShareCardScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  
  const { user } = useAuthStore();
  const { stats } = useStatsStore();
  
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);
  
  const handleShare = async () => {
    setSharing(true);
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        
        if (Platform.OS === 'web') {
          // Web fallback - share text
          await Share.share({
            message: `I've saved ${stats?.total_items_checked || 0} items from being forgotten using Forgotten Item Reminder! My current streak is ${stats?.current_streak || 0} days. Download the app and never forget anything again!`,
          });
        } else {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: 'Share your stats',
            });
          } else {
            await Share.share({
              message: `I've saved ${stats?.total_items_checked || 0} items from being forgotten! Download Forgotten Item Reminder app!`,
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Share error:', error);
      // Fallback to text share
      await Share.share({
        message: `I've saved ${stats?.total_items_checked || 0} items from being forgotten using Forgotten Item Reminder! Download the app and never forget anything again!`,
      });
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
      
      {/* Shareable Card */}
      <View style={styles.cardContainer}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View style={styles.shareCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#fff" />
              <Text style={styles.cardAppName}>Forgotten Item Reminder</Text>
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
                  I almost forgot {stats.total_items_forgotten} items... but this app saved me!
                </Text>
              ) : (
                <Text style={styles.cardMessageText}>
                  Never forgotten a thing since using this app!
                </Text>
              )}
            </View>
            
            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Download the app and never forget anything!</Text>
            </View>
          </View>
        </ViewShot>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Share to Social"
          onPress={handleShare}
          loading={sharing}
          size="large"
          style={styles.shareBtn}
          icon={<Ionicons name="share-social" size={24} color="#fff" />}
        />
        
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
    ...SHADOWS.large,
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
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
  },
});
