import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useChecklistStore, Checklist } from '../../src/store/checklistStore';
import { ChecklistItemRow } from '../../src/components/ChecklistItemRow';
import { Button } from '../../src/components/Button';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';

export default function ChecklistsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  
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
      Alert.alert(t('common.error'), error.message);
    }
  };
  
  const handleDeleteChecklist = () => {
    if (!selectedChecklist) return;
    Alert.alert(
      t('common.delete'),
      t('checklists.deleteConfirm', { name: selectedChecklist.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChecklist(selectedChecklist.id);
              setSelectedChecklist(checklists.filter(c => c.id !== selectedChecklist.id)[0] || null);
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
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
      Alert.alert(t('common.success'), 'Checklist saved!');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };
  
  const checklistTypes = [
    { value: 'home', label: t('checklists.homeExit'), icon: 'home' },
    { value: 'travel', label: t('checklists.travelHotel'), icon: 'airplane' },
    { value: 'office', label: t('checklists.officeExit'), icon: 'briefcase' },
    { value: 'custom', label: t('checklists.custom'), icon: 'list' },
  ];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('checklists.title')}
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
              color={colors.text}
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
                  : colors.card,
              },
            ]}
            onPress={() => setSelectedChecklist(checklist)}
          >
            <Ionicons
              name={
                checklist.type === 'home' ? 'home'
                  : checklist.type === 'travel' ? 'airplane'
                  : checklist.type === 'office' ? 'briefcase'
                  : 'list'
              }
              size={18}
              color={selectedChecklist?.id === checklist.id ? '#fff' : colors.text}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedChecklist?.id === checklist.id ? '#fff' : colors.text,
                },
              ]}
              numberOfLines={1}
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
            <Text style={[styles.checklistName, { color: colors.text }]}>
              {selectedChecklist.name}
            </Text>
            {editMode && (
              <TouchableOpacity onPress={handleDeleteChecklist}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
            {t('checklists.items', { count: selectedChecklist.items.length })}
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
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color={COLORS.primary} />
              <Text style={[styles.addItemText, { color: COLORS.primary }]}>
                {t('checklists.addItem')}
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('checklists.noChecklists')}
          </Text>
          <Button
            title={t('checklists.createNew')}
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('checklists.addItem')}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t('checklists.itemName')}
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemName('');
                }}
                variant="outline"
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title={t('common.add')}
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('checklists.createNew')}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t('checklists.checklistName')}
              placeholderTextColor={colors.textSecondary}
              value={newChecklistName}
              onChangeText={setNewChecklistName}
              autoFocus
            />
            <Text style={[styles.typeLabel, { color: colors.text }]}>
              {t('checklists.type')}
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
                        : colors.background,
                      borderWidth: 1,
                      borderColor: newChecklistType === type.value
                        ? COLORS.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => setNewChecklistType(type.value)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={newChecklistType === type.value ? '#fff' : colors.text}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      {
                        color: newChecklistType === type.value ? '#fff' : colors.text,
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
                title={t('common.cancel')}
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
    maxWidth: 100,
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
    gap: SPACING.sm,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
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
