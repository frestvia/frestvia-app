import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Vibration,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useChecklistStore } from '../src/store/checklistStore';
import { useStatsStore } from '../src/store/statsStore';
import { useAuthStore } from '../src/store/authStore';
import { useSpeech } from '../src/hooks/useSpeech';
import { ChecklistItemRow } from '../src/components/ChecklistItemRow';
import { useTheme, COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FOOTER_HEIGHT = 100;

export default function ExitModeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { activeChecklist, toggleItem, resetChecklist } = useChecklistStore();
  const { recordExit, fetchStats } = useStatsStore();
  const { refreshUser } = useAuthStore();
  const { speakReminder, speakSuccess, speakMultipleReminders, stop } = useSpeech();

  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Debounce ref to prevent double taps
  const isProcessingRef = useRef(false);

  // Animations
  const buttonScale = useSharedValue(1);
  const successScale = useSharedValue(0);
  const modalSlide = useSharedValue(300);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (!activeChecklist) {
      router.back();
    } else {
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

  // Main "Finish Anyway" / "All Done" button handler with debounce
  const handleFinishPress = useCallback(() => {
    console.log('[ExitMode] handleFinishPress called, activeChecklist:', !!activeChecklist, 'loading:', loading, 'processing:', isProcessingRef.current);
    if (!activeChecklist || isProcessingRef.current || loading) return;

    // Animate button press
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    try { Vibration.vibrate(30); } catch (e) { /* web fallback */ }

    const uncheckedItems = activeChecklist.items.filter((i) => !i.checked);
    console.log('[ExitMode] uncheckedItems:', uncheckedItems.length);

    if (uncheckedItems.length === 0) {
      // ALL items checked - perfect exit, skip modal
      handlePerfectExit();
    } else {
      // Some items unchecked - show confirmation modal
      openConfirmModal();
    }
  }, [activeChecklist, loading]);

  const openConfirmModal = () => {
    setShowConfirmModal(true);
    modalSlide.value = withSpring(0, { damping: 20, stiffness: 200 });
    modalOpacity.value = withTiming(1, { duration: 200 });
  };

  const closeConfirmModal = () => {
    modalSlide.value = withTiming(300, { duration: 200, easing: Easing.ease });
    modalOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setShowConfirmModal(false), 220);
  };

  // "I'm taking them" - mark remaining as completed
  const handleTakingThem = async () => {
    if (!activeChecklist || isProcessingRef.current) return;
    isProcessingRef.current = true;
    closeConfirmModal();

    // Mark all unchecked items as checked
    const uncheckedItems = activeChecklist.items.filter((i) => !i.checked);
    uncheckedItems.forEach((item) => {
      toggleItem(activeChecklist.id, item.id);
    });

    // Small delay for visual feedback of items checking
    setTimeout(() => {
      const allItemIds = activeChecklist.items.map((i) => i.id);
      completeExit(allItemIds, []);
    }, 400);
  };

  // "I'm leaving them" - mark unchecked as forgotten
  const handleLeavingThem = async () => {
    if (!activeChecklist || isProcessingRef.current) return;
    isProcessingRef.current = true;
    closeConfirmModal();

    const checkedItems = activeChecklist.items.filter((i) => i.checked).map((i) => i.id);
    const forgottenItems = activeChecklist.items.filter((i) => !i.checked).map((i) => i.id);

    setTimeout(() => {
      completeExit(checkedItems, forgottenItems);
    }, 300);
  };

  // Perfect exit (all items checked)
  const handlePerfectExit = async () => {
    if (!activeChecklist || isProcessingRef.current) return;
    isProcessingRef.current = true;

    const allItemIds = activeChecklist.items.map((i) => i.id);
    completeExit(allItemIds, []);
  };

  // Core exit completion logic
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
        // Perfect exit - show success overlay
        setShowSuccessOverlay(true);
        successScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        Vibration.vibrate([0, 100, 50, 100]);
        if (voiceEnabled) speakSuccess();

        setTimeout(() => {
          router.back();
          setTimeout(() => {
            router.push('/share-card');
          }, 300);
        }, 1500);
      } else {
        // Some forgotten items - speak reminders
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

        // Navigate back to home
        router.back();
      }
    } catch (error: any) {
      console.error('Exit error:', error);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalSlide.value }],
  }));

  if (!activeChecklist) {
    return null;
  }

  const checkedCount = activeChecklist.items.filter((i) => i.checked).length;
  const totalCount = activeChecklist.items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const uncheckedItems = activeChecklist.items.filter((i) => !i.checked);

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

      {/* Items List - button is INSIDE to avoid any touch interception */}
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

        {/* Spacer to push button to bottom */}
        <View style={{ flex: 1, minHeight: 40 }} />

        {/* ========== FINISH BUTTON (inside ScrollView - no overlap) ========== */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            onPress={() => {
              console.log('[ExitMode] Button tapped');
              handleFinishPress();
            }}
            disabled={loading}
            activeOpacity={0.8}
            style={[
              styles.finishButton,
              {
                backgroundColor: isComplete ? COLORS.success : COLORS.primary,
                opacity: loading ? 0.6 : 1,
              },
            ]}
          >
            <View style={styles.finishButtonInner}>
              {loading ? (
                <>
                  <Ionicons name="hourglass-outline" size={24} color="#fff" />
                  <Text style={styles.finishButtonText}>Processing...</Text>
                </>
              ) : isComplete ? (
                <>
                  <Ionicons name="checkmark-circle" size={26} color="#fff" />
                  <Text style={styles.finishButtonText}>All Done - Go!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="exit-outline" size={26} color="#fff" />
                  <Text style={styles.finishButtonText}>Finish Anyway</Text>
                  {uncheckedItems.length > 0 && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{uncheckedItems.length}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========== CONFIRMATION MODAL ========== */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeConfirmModal}
      >
        <Animated.View style={[styles.modalBackdrop, modalBackdropStyle]}>
          <TouchableOpacity style={styles.modalBackdropPress} onPress={closeConfirmModal} activeOpacity={1} />
        </Animated.View>
        <View style={[styles.modalContainer, { pointerEvents: 'box-none' as const }]}>
          <Animated.View
            style={[
              styles.modalContent,
              modalContentStyle,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            {/* Warning Icon */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconBg}>
                <Ionicons name="warning" size={32} color="#F59E0B" />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              You may be forgetting items
            </Text>

            {/* Message */}
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              You have {uncheckedItems.length} unchecked item{uncheckedItems.length !== 1 ? 's' : ''}.
              Are you leaving them behind or taking them with you?
            </Text>

            {/* Unchecked Items Preview */}
            <View style={[styles.uncheckedPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF7ED' }]}>
              {uncheckedItems.slice(0, 4).map((item) => (
                <View key={item.id} style={styles.uncheckedItem}>
                  <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                  <Text
                    style={[styles.uncheckedItemText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>
              ))}
              {uncheckedItems.length > 4 && (
                <Text style={[styles.moreItemsText, { color: colors.textSecondary }]}>
                  +{uncheckedItems.length - 4} more item{uncheckedItems.length - 4 !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              {/* "I'm taking them" - Primary action */}
              <TouchableOpacity
                onPress={handleTakingThem}
                activeOpacity={0.8}
                style={[styles.modalActionBtn, styles.takingBtn]}
              >
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.takingBtnText}>I'm taking them</Text>
              </TouchableOpacity>

              {/* "I'm leaving them" - Secondary action */}
              <TouchableOpacity
                onPress={handleLeavingThem}
                activeOpacity={0.8}
                style={[
                  styles.modalActionBtn,
                  styles.leavingBtn,
                  { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB' },
                ]}
              >
                <Ionicons name="alert-circle" size={22} color="#F59E0B" />
                <Text style={[styles.leavingBtnText, { color: colors.text }]}>
                  I'm leaving them
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                onPress={closeConfirmModal}
                activeOpacity={0.6}
                style={styles.cancelBtn}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  Go Back
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ========== SUCCESS OVERLAY ========== */}
      {showSuccessOverlay && (
        <View style={[styles.successOverlay, { pointerEvents: 'none' as const }]}>
          <Animated.View style={[styles.successContent, successAnimatedStyle]}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
            </View>
            <Text style={styles.successText}>Perfect Exit!</Text>
            <Text style={styles.successSubtext}>Nothing forgotten today</Text>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  // ====== BUTTON WRAPPER (inside scroll) ======
  buttonWrapper: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  finishButton: {
    width: '100%',
    height: 60,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  finishButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ====== CONFIRMATION MODAL ======
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdropPress: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  uncheckedPreview: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  uncheckedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  uncheckedItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  moreItemsText: {
    fontSize: 13,
    marginTop: 4,
    paddingLeft: 24,
    fontStyle: 'italic',
  },
  modalActions: {
    gap: 10,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: RADIUS.md,
    gap: 10,
  },
  takingBtn: {
    backgroundColor: COLORS.success,
  },
  takingBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  leavingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  leavingBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // ====== SUCCESS OVERLAY ======
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
  },
  successCircle: {
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  successSubtext: {
    fontSize: FONTS.sizes.md,
    color: '#64748B',
    marginTop: SPACING.xs,
  },
});
