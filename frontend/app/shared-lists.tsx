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
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { useSharedListStore, SharedList } from '../src/store/sharedListStore';
import { useAuthStore } from '../src/store/authStore';
import { suggestEmoji } from '../src/constants/emojis';
import { Button } from '../src/components/Button';

export default function SharedListsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { lists, fetchLists, createList, joinList, deleteList, isLoading } = useSharedListStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newItems, setNewItems] = useState<{ text: string; emoji?: string }[]>([]);
  const [currentItemText, setCurrentItemText] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const handleAddItem = () => {
    if (!currentItemText.trim()) return;
    const emoji = suggestEmoji(currentItemText);
    setNewItems([...newItems, { text: currentItemText.trim(), emoji }]);
    setCurrentItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const handleCreateList = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a list title');
      return;
    }
    if (newItems.length === 0) {
      Alert.alert('Error', 'Add at least one item');
      return;
    }
    setSaving(true);
    try {
      await createList({ title: newTitle.trim(), emoji: newEmoji || undefined, items: newItems });
      setShowCreateModal(false);
      setNewTitle('');
      setNewEmoji('');
      setNewItems([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create list');
    } finally {
      setSaving(false);
    }
  };

  const handleJoinList = async () => {
    if (!joinCode.trim()) return;
    setSaving(true);
    try {
      const list = await joinList(joinCode.trim());
      setShowJoinModal(false);
      setJoinCode('');
      router.push(`/shared-list-detail?id=${list.id}`);
    } catch (error: any) {
      Alert.alert('Error', 'Invalid share code. Please check and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareCode = async (list: SharedList) => {
    try {
      await Share.share({
        message: `Join my shared list "${list.title}" on Frestvia! Use code: ${list.share_code}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDeleteList = (list: SharedList) => {
    const isOwner = list.creator_id === user?.id;
    Alert.alert(
      isOwner ? 'Delete List' : 'Leave List',
      isOwner ? `Delete "${list.title}"?` : `Leave "${list.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: isOwner ? 'Delete' : 'Leave', style: 'destructive', onPress: () => deleteList(list.id) },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'in_progress': return COLORS.warning;
      default: return COLORS.primary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      default: return 'Pending';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shared Lists</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Create List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="enter" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Join List</Text>
          </TouchableOpacity>
        </View>

        {/* Lists */}
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
        ) : lists.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No shared lists yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create a list and share it with family or friends
            </Text>
          </View>
        ) : (
          lists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={[styles.listCard, { backgroundColor: colors.card }, SHADOWS.small]}
              onPress={() => router.push(`/shared-list-detail?id=${list.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.listCardHeader}>
                <Text style={styles.listEmoji}>{list.emoji || '\ud83d\udcdd'}</Text>
                <View style={styles.listInfo}>
                  <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                    {list.title}
                  </Text>
                  <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
                    {list.items.length} items · {list.members.length} members
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(list.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(list.status) }]}>
                    {getStatusLabel(list.status)}
                  </Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                <View style={[
                  styles.progressFill,
                  {
                    backgroundColor: getStatusColor(list.status),
                    width: `${list.items.length > 0 ? (list.items.filter(i => i.checked_by.length > 0).length / list.items.length) * 100 : 0}%`
                  }
                ]} />
              </View>
              
              {/* Share Code + Actions */}
              <View style={styles.listCardFooter}>
                <TouchableOpacity style={styles.shareCodeBtn} onPress={() => handleShareCode(list)}>
                  <Ionicons name="share-social" size={14} color={COLORS.primary} />
                  <Text style={[styles.shareCode, { color: COLORS.primary }]}> {list.share_code}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteList(list)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Shared List</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="List title (e.g., Grocery List)"
              placeholderTextColor={colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {/* Add Items */}
            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.itemInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Add item..."
                placeholderTextColor={colors.textSecondary}
                value={currentItemText}
                onChangeText={setCurrentItemText}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                <Ionicons name="add-circle" size={36} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Item List */}
            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              {newItems.map((item, index) => (
                <View key={index} style={[styles.itemRow, { backgroundColor: colors.background }]}>
                  <Text style={styles.itemEmoji}>{item.emoji || '\u2022'}</Text>
                  <Text style={[styles.itemText, { color: colors.text }]}>{item.text}</Text>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Button
              title={`Create List (${newItems.length} items)`}
              onPress={handleCreateList}
              loading={saving}
              disabled={!newTitle.trim() || newItems.length === 0}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Modal */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Join a Shared List</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.joinSubtext, { color: colors.textSecondary }]}>
              Enter the 6-digit code shared with you
            </Text>
            <TextInput
              style={[styles.codeInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="ABC123"
              placeholderTextColor={colors.textSecondary}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />
            <Button title="Join List" onPress={handleJoinList} loading={saving} style={{ marginTop: SPACING.md }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.xs },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: FONTS.sizes.sm },
  emptyState: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', marginTop: SPACING.md },
  emptySubtitle: { fontSize: FONTS.sizes.sm, marginTop: SPACING.xs, textAlign: 'center' },
  listCard: { borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  listCardHeader: { flexDirection: 'row', alignItems: 'center' },
  listEmoji: { fontSize: 32, marginRight: SPACING.sm },
  listInfo: { flex: 1 },
  listTitle: { fontSize: FONTS.sizes.md, fontWeight: '600' },
  listMeta: { fontSize: FONTS.sizes.xs, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  progressBg: { height: 4, borderRadius: 2, marginTop: SPACING.sm },
  progressFill: { height: 4, borderRadius: 2 },
  listCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  shareCodeBtn: { flexDirection: 'row', alignItems: 'center' },
  shareCode: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { padding: SPACING.lg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600' },
  modalInput: { height: 56, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, fontSize: FONTS.sizes.md, marginBottom: SPACING.md },
  addItemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  itemInput: { flex: 1, height: 48, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, fontSize: FONTS.sizes.md },
  addItemBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  itemsList: { maxHeight: 200 },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: SPACING.xs },
  itemEmoji: { fontSize: 18, marginRight: SPACING.sm },
  itemText: { flex: 1, fontSize: FONTS.sizes.md },
  joinSubtext: { fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  codeInput: { height: 64, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, fontSize: 28, fontWeight: 'bold', textAlign: 'center', letterSpacing: 8 },
});
