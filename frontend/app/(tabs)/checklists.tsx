import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChecklistStore, Checklist, ChecklistItem } from '../../src/store/checklistStore';
import { ChecklistItemRow } from '../../src/components/ChecklistItemRow';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';

export default function ChecklistsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    checklists,
    fetchChecklists,
    updateChecklist,
    createChecklist,
    deleteChecklist,
    toggleItem,
    addItem,
    removeItem,
  } = useChecklistStore();
  
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistType, setNewChecklistType] = useState('custom');
  const [editMode, setEditMode] = useState(false);
  
  useEffect(() => {
    fetchChecklists();
  }, []);
  
  useEffect(() => {
    if (checklists.length > 0 && !selectedChecklist) {
      setSelectedChecklist(checklists[0]);
    } else if (selectedChecklist) {
      const updated = checklists.find(c => c.id === selectedChecklist.id);
      if (updated) setSelectedChecklist(updated);
    }
  }, [checklists]);
  
  const handleAddItem = () => {
    if (!newItemName.trim() || !selectedChecklist) return;
    addItem(selectedChecklist.id, newItemName.trim());
    setNewItemName('');
    setShowAddModal(false);
  };
  
  const handleCreateChecklist = async () => {
    if (!newChecklistName.trim()) return;
    try {
      const newChecklist = await createChecklist({
        name: newChecklistName.trim(),
        type: newChecklistType,
        items: [],
      });
      setNewChecklistName('');
      setShowCreateModal(false);
      setSelectedChecklist(newChecklist);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleDeleteChecklist = () => {
    if (!selectedChecklist) return;
    Alert.alert(
      'Delete Checklist',
      `Are you sure you want to delete "${selectedChecklist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChecklist(selectedChecklist.id);
              setSelectedChecklist(checklists.filter(c => c.id !== selectedChecklist.id)[0] || null);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };
  
  const handleSaveChecklist = async () => {
    if (!selectedChecklist) return;
    try {
      await updateChecklist(selectedChecklist.id, {
        items: selectedChecklist.items,
      });
      setEditMode(false);
      Alert.alert('Success', 'Checklist saved!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const checklistTypes = [
    { value: 'home', label: 'Home', icon: 'home' },
    { value: 'travel', label: 'Travel', icon: 'airplane' },
    { value: 'office', label: 'Office', icon: 'briefcase' },
    { value: 'custom', label: 'Custom', icon: 'list' },
  ];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? COLORS.textDark : COLORS.text }]}>
          My Checklists
        </Text>
        <View style={styles.headerButtons}>
          {editMode && (
            <TouchableOpacity
              style={[styles.headerBtn, { marginRight: SPACING.sm }]}
              onPress={handleSaveChecklist}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.success} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setEditMode(!editMode)}
          >
            <Ionicons
              name={editMode ? 'close' : 'pencil'}
              size={24}
              color={isDark ? COLORS.textDark : COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { marginLeft: SPACING.sm }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Checklist Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {checklists.map((checklist) => (
          <TouchableOpacity
            key={checklist.id}
            style={[
              styles.tab,
              {
                backgroundColor: selectedChecklist?.id === checklist.id
                  ? COLORS.primary
                  : isDark
                  ? COLORS.cardDark
                  : COLORS.card,
              },
            ]}
            onPress={() => setSelectedChecklist(checklist)}
          >
            <Ionicons
              name={
                checklist.type === 'home'
                  ? 'home'
                  : checklist.type === 'travel'
                  ? 'airplane'
                  : checklist.type === 'office'
                  ? 'briefcase'
                  : 'list'
              }
              size={18}
              color={selectedChecklist?.id === checklist.id ? '#fff' : isDark ? COLORS.textDark : COLORS.text}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedChecklist?.id === checklist.id ? '#fff' : isDark ? COLORS.textDark : COLORS.text,
                },
              ]}
            >
              {checklist.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Items List */}
      {selectedChecklist ? (
        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          <View style={styles.checklistHeader}>
            <Text style={[styles.checklistName, { color: isDark ? COLORS.textDark : COLORS.text }]}>
              {selectedChecklist.name}
            </Text>
            {editMode && (
              <TouchableOpacity onPress={handleDeleteChecklist}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.itemCount, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            {selectedChecklist.items.length} items
          </Text>
          
          {selectedChecklist.items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              name={item.name}
              checked={item.checked}
              onToggle={() => toggleItem(selectedChecklist.id, item.id)}
              onDelete={() => removeItem(selectedChecklist.id, item.id)}
              showDelete={editMode}
            />
          ))}
          
          {editMode && (
            <TouchableOpacity
              style={[
                styles.addItemBtn,
                { borderColor: isDark ? COLORS.borderDark : COLORS.border },
              ]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color={COLORS.primary} />
              <Text style={[styles.addItemText, { color: COLORS.primary }]}>
                Add Item
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color={COLORS.textSecondary} />
          <Text style={[styles.emptyText, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            No checklists yet
          </Text>
          <Button
            title="Create Checklist"
            onPress={() => setShowCreateModal(true)}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      )}
      
      {/* Add Item Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: isDark ? COLORS.textDark : COLORS.text }]}>
              Add New Item
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background,
                  color: isDark ? COLORS.textDark : COLORS.text,
                },
              ]}
              placeholder="Item name"
              placeholderTextColor={COLORS.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemName('');
                }}
                variant="outline"
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title="Add"
                onPress={handleAddItem}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Create Checklist Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: isDark ? COLORS.textDark : COLORS.text }]}>
              Create New Checklist
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? COLORS.backgroundDark : COLORS.background,
                  color: isDark ? COLORS.textDark : COLORS.text,
                },
              ]}
              placeholder="Checklist name"
              placeholderTextColor={COLORS.textSecondary}
              value={newChecklistName}
              onChangeText={setNewChecklistName}
              autoFocus
            />
            <Text style={[styles.typeLabel, { color: isDark ? COLORS.textDark : COLORS.text }]}>
              Type
            </Text>
            <View style={styles.typeGrid}>
              {checklistTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: newChecklistType === type.value
                        ? COLORS.primary
                        : isDark
                        ? COLORS.backgroundDark
                        : COLORS.background,
                    },
                  ]}
                  onPress={() => setNewChecklistType(type.value)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={newChecklistType === type.value ? '#fff' : isDark ? COLORS.textDark : COLORS.text}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      {
                        color: newChecklistType === type.value ? '#fff' : isDark ? COLORS.textDark : COLORS.text,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowCreateModal(false);
                  setNewChecklistName('');
                }}
                variant="outline"
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title="Create"
                onPress={handleCreateChecklist}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: SPACING.xs,
  },
  tabs: {
    maxHeight: 50,
    marginBottom: SPACING.md,
  },
  tabsContent: {
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addItemText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.md,
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
  typeLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  typeBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});
