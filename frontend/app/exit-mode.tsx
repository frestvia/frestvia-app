import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useChecklistStore } from '../src/store/checklistStore';
import { useStatsStore } from '../src/store/statsStore';
import { useAuthStore } from '../src/store/authStore';
import { useSpeech } from '../src/hooks/useSpeech';
import { ChecklistItemRow } from '../src/components/ChecklistItemRow';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { useTranslation } from 'react-i18next';

export default function ExitModeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  
  const { activeChecklist, toggleItem, resetChecklist } = useChecklistStore();
  const { recordExit, fetchStats } = useStatsStore();
  const { refreshUser } = useAuthStore();
  const { speakReminder, speakSuccess, speakMultipleReminders, stop } = useSpeech();
  
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const scale = useSharedValue(1);
  const successScale = useSharedValue(0);
  
  useEffect(() => {
    if (!activeChecklist) {
      router.back();
    } else {
      // Reset checklist when entering exit mode
      resetChecklist(activeChecklist.id);
    }
    
    return () => {
      stop();
    };
  }, []);
  
  useEffect(() => {
    if (activeChecklist) {
      const allChecked = activeChecklist.items.every((item) => item.checked);
      setIsComplete(allChecked && activeChecklist.items.length > 0);
    }
  }, [activeChecklist]);
  
  const handleToggle = (itemId: string) => {
    if (!activeChecklist) return;
    toggleItem(activeChecklist.id, itemId);
    Vibration.vibrate(50);
  };
  
  const handleFinish = async () => {
    if (!activeChecklist) return;
    
    const checkedItems = activeChecklist.items.filter((i) => i.checked).map((i) => i.id);
    const forgottenItems = activeChecklist.items.filter((i) => !i.checked).map((i) => i.id);
    
    if (forgottenItems.length > 0) {
      const forgottenNames = activeChecklist.items
        .filter((i) => !i.checked)
        .map((i) => i.name);
      
      Alert.alert(
        t('exitMode.itemsNotChecked'),
        t('exitMode.notCheckedMessage', { items: forgottenNames.join(', ') }),
        [
          { text: t('exitMode.goBack'), style: 'cancel' },
          {
            text: t('exitMode.proceedAnyway'),
            onPress: () => completeExit(checkedItems, forgottenItems),
          },
        ]
      );
    } else {
      completeExit(checkedItems, forgottenItems);
    }
  };
  
  const completeExit = async (checkedItems: string[], forgottenItems: string[]) => {
    if (!activeChecklist) return;
    
    setLoading(true);
    try {
      await recordExit({
        checklist_id: activeChecklist.id,
        checked_items: checkedItems,
        forgotten_items: forgottenItems,
      });
      
      await Promise.all([fetchStats(), refreshUser()]);
      
      if (forgottenItems.length === 0) {
        // Perfect exit!
        successScale.value = withSpring(1);
        Vibration.vibrate([0, 100, 50, 100]);
        if (voiceEnabled) speakSuccess();
        
        setTimeout(() => {
          router.back();
          setTimeout(() => {
            router.push('/share-card');
          }, 300);
        }, 1500);
      } else {
        // Some forgotten items - speak them out!
        const forgottenNames = activeChecklist.items
          .filter((i) => forgottenItems.includes(i.id))
          .map((i) => i.name);
        
        if (voiceEnabled) {
          if (forgottenNames.length === 1) {
            speakReminder(forgottenNames[0]);
          } else if (forgottenNames.length > 1) {
            speakMultipleReminders(forgottenNames);
          }
        }
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));
  
  if (!activeChecklist) {
    return null;
  }
  
  const checkedCount = activeChecklist.items.filter((i) => i.checked).length;
  const totalCount = activeChecklist.items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Exit Mode
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {activeChecklist.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.voiceBtn}
          onPress={() => setVoiceEnabled(!voiceEnabled)}
        >
          <Ionicons
            name={voiceEnabled ? 'volume-high' : 'volume-mute'}
            size={24}
            color={voiceEnabled ? COLORS.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {checkedCount} of {totalCount} checked
          </Text>
          <Text style={[styles.progressPercent, { color: COLORS.primary }]}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isComplete ? COLORS.success : COLORS.primary,
              },
            ]}
          />
        </View>
      </View>
      
      {/* Items List */}
      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Tap each item you have with you
        </Text>
        {activeChecklist.items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            name={item.name}
            checked={item.checked}
            onToggle={() => handleToggle(item.id)}
          />
        ))}
      </ScrollView>
      
      {/* Footer */}
      <View style={[
        styles.footer,
        {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
        },
      ]}>
        <TouchableOpacity
          style={[
            styles.finishButton,
            {
              backgroundColor: isComplete ? COLORS.success : COLORS.primary,
            },
          ]}
          onPress={handleFinish}
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.finishButtonInner}>
              <View style={[styles.loadingDot, { backgroundColor: '#fff' }]} />
              <Text style={styles.finishButtonText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.finishButtonInner}>
              <Ionicons
                name={isComplete ? 'checkmark-circle' : 'exit'}
                size={24}
                color="#fff"
              />
              <Text style={styles.finishButtonText}>
                {isComplete ? 'All Done - Go!' : 'Finish Anyway'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Success Overlay */}
      <Animated.View style={[styles.successOverlay, successAnimatedStyle]} pointerEvents="none">
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.successText}>Perfect Exit!</Text>
          <Text style={styles.successSubtext}>Nothing forgotten today</Text>
        </View>
      </Animated.View>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: RADIUS.full,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  finishButton: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
  loadingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
  },
  successText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: SPACING.md,
  },
  successSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.light.textSecondary,
    marginTop: SPACING.xs,
  },
});
