import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { useSharedListStore } from '../src/store/sharedListStore';
import { useAuthStore } from '../src/store/authStore';
import { suggestEmoji } from '../src/constants/emojis';
import { useSpeech } from '../src/hooks/useSpeech';
import { Button } from '../src/components/Button';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function SharedListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { currentList, fetchList, toggleItem, addItem, setReminder } = useSharedListStore();
  const { speak } = useSpeech();

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (id) fetchList(id);
  }, [id]);

  const handleToggle = async (itemId: string) => {
    if (!id) return;
    Vibration.vibrate(50);
    await toggleItem(id, itemId);
  };

  const handleAddItem = async () => {
    if (!id || !newItemText.trim()) return;
    const emoji = suggestEmoji(newItemText);
    await addItem(id, { text: newItemText.trim(), emoji });
    setNewItemText('');
    setShowAddItem(false);
  };

  const handleShare = async () => {
    if (!currentList) return;
    try {
      await Share.share({
        message: `Join my shared list "${currentList.title}" on Frestvia! Use code: ${currentList.share_code}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSetReminder = async (type: string, minutes?: number) => {
    if (!id || !currentList) return;
    try {
      await setReminder(id, { type, minutes });
      
      // Schedule local notification
      if (type === 'after_minutes' && minutes) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${currentList.title}`,
            body: `Don't forget your ${currentList.title} items!`,
            sound: true,
          },
          trigger: { seconds: minutes * 60 },
        });
        speak(`Reminder set for ${minutes} minutes`);
      }
      
      setShowReminder(false);
      Alert.alert('Reminder Set!', `You'll be reminded about this list.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to set reminder');
    }
  };

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  if (!currentList) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Loading...</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>
    );
  }

  const checkedCount = currentList.items.filter((i) => i.checked_by.length > 0).length;
  const totalCount = currentList.items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {currentList.emoji || '\ud83d\udcdd'} {currentList.title}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Share Code Card */}
        <View style={[styles.codeCard, { backgroundColor: COLORS.primary + '10' }]}>
          <View>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Share Code</Text>
            <Text style={[styles.codeValue, { color: COLORS.primary }]}>{currentList.share_code}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleShare}>
            <Ionicons name="copy" size={18} color={COLORS.primary} />
            <Text style={[styles.copyText, { color: COLORS.primary }]}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {checkedCount} of {totalCount} completed
          </Text>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress === 100 ? COLORS.success : COLORS.primary }]} />
          </View>
        </View>

        {/* Members */}
        <View style={styles.membersRow}>
          {currentList.members.map((m) => (
            <View key={m.id} style={[styles.memberBadge, { backgroundColor: COLORS.primary + '15' }]}>
              <Text style={styles.memberInitial}>{m.name.charAt(0).toUpperCase()}</Text>
            </View>
          ))}
          <Text style={[styles.membersText, { color: colors.textSecondary }]}>
            {currentList.members.length} member{currentList.members.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Items */}
        <View style={[styles.itemsContainer, { backgroundColor: colors.card }, SHADOWS.small]}>
          {currentList.items.map((item, index) => {
            const isChecked = item.checked_by.includes(user?.id || '');
            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => handleToggle(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: isChecked ? COLORS.success : 'transparent',
                      borderColor: isChecked ? COLORS.success : colors.border,
                    },
                  ]}>
                    {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.itemEmoji}>{item.emoji || '\u2022'}</Text>
                  <Text style={[
                    styles.itemText,
                    { color: colors.text },
                    isChecked && styles.itemChecked,
                  ]}>
                    {item.text}
                  </Text>
                  {item.checked_by.length > 0 && (
                    <View style={[styles.checkedBadge, { backgroundColor: COLORS.success + '20' }]}>
                      <Ionicons name="checkmark" size={10} color={COLORS.success} />
                      <Text style={styles.checkedCount}>{item.checked_by.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {index < currentList.items.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary + '15' }]}
            onPress={() => setShowAddItem(true)}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.warning + '15' }]}
            onPress={() => setShowReminder(true)}
          >
            <Ionicons name="alarm" size={20} color={COLORS.warning} />
            <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>Remind Me</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={showAddItem} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item</Text>
            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Item name..."
                placeholderTextColor={colors.textSecondary}
                value={newItemText}
                onChangeText={setNewItemText}
                autoFocus
              />
            </View>
            {newItemText && suggestEmoji(newItemText) && (
              <View style={styles.emojiHint}>
                <Text style={{ fontSize: 24 }}>{suggestEmoji(newItemText)}</Text>
                <Text style={[{ color: colors.textSecondary, marginLeft: SPACING.sm, fontSize: FONTS.sizes.sm }]}>Auto-detected emoji</Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => { setShowAddItem(false); setNewItemText(''); }} variant="outline" style={{ flex: 1, marginRight: SPACING.sm }} />
              <Button title="Add" onPress={handleAddItem} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reminder Modal */}
      <Modal visible={showReminder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set Reminder</Text>
            <Text style={[styles.reminderSubtext, { color: colors.textSecondary }]}>
              When should we remind you about this list?
            </Text>
            {[
              { label: 'In 15 minutes', minutes: 15, icon: 'time' },
              { label: 'In 30 minutes', minutes: 30, icon: 'time' },
              { label: 'In 1 hour', minutes: 60, icon: 'time' },
              { label: 'In 2 hours', minutes: 120, icon: 'time' },
              { label: 'Tomorrow morning', minutes: 720, icon: 'sunny' },
            ].map((option) => (
              <TouchableOpacity
                key={option.minutes}
                style={[styles.reminderOption, { backgroundColor: colors.background }]}
                onPress={() => handleSetReminder('after_minutes', option.minutes)}
              >
                <Ionicons name={option.icon as any} size={20} color={COLORS.primary} />
                <Text style={[styles.reminderLabel, { color: colors.text }]}>{option.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
            <Button title="Cancel" onPress={() => setShowReminder(false)} variant="outline" style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
  codeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  codeLabel: { fontSize: FONTS.sizes.xs },
  codeValue: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', letterSpacing: 4 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  progressSection: { marginBottom: SPACING.md },
  progressText: { fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs },
  progressBg: { height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  membersRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, gap: SPACING.xs },
  memberBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  memberInitial: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.primary },
  membersText: { fontSize: FONTS.sizes.xs, marginLeft: SPACING.xs },
  itemsContainer: { borderRadius: RADIUS.md, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  itemEmoji: { fontSize: 18, marginRight: SPACING.sm },
  itemText: { flex: 1, fontSize: FONTS.sizes.md },
  itemChecked: { textDecorationLine: 'line-through', opacity: 0.5 },
  checkedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full, gap: 2 },
  checkedCount: { fontSize: 10, color: COLORS.success, fontWeight: 'bold' },
  divider: { height: 1, marginLeft: 56 },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.xs },
  actionBtnText: { fontWeight: '600', fontSize: FONTS.sizes.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { padding: SPACING.lg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', marginBottom: SPACING.md },
  addItemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  modalInput: { flex: 1, height: 56, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, fontSize: FONTS.sizes.md },
  emojiHint: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  modalButtons: { flexDirection: 'row', marginTop: SPACING.md },
  reminderSubtext: { fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  reminderOption: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  reminderLabel: { flex: 1, fontSize: FONTS.sizes.md },
});
