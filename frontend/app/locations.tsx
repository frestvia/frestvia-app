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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { useLocationStore, Location } from '../src/store/locationStore';
import { useLocation } from '../src/hooks/useLocation';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/Button';

export default function LocationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const { user } = useAuthStore();
  const { locations, fetchLocations, createLocation, deleteLocation, isLoading } =
    useLocationStore();
  const { getCurrentPosition, reverseGeocode, isLoading: gpsLoading } = useLocation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCoords, setNewCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [detectingGPS, setDetectingGPS] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDetectLocation = async () => {
    setDetectingGPS(true);
    const coords = await getCurrentPosition();
    if (coords) {
      setNewCoords(coords);
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setNewAddress(address);
    }
    setDetectingGPS(false);
  };

  const handleSaveLocation = async () => {
    if (!newLocationName.trim()) {
      Alert.alert(t('common.error'), t('locations.enterName'));
      return;
    }
    setSaving(true);
    try {
      await createLocation({
        name: newLocationName.trim(),
        address: newAddress || undefined,
        latitude: newCoords?.latitude,
        longitude: newCoords?.longitude,
      });
      setShowAddModal(false);
      setNewLocationName('');
      setNewAddress('');
      setNewCoords(null);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = (loc: Location) => {
    Alert.alert(
      t('common.delete'),
      t('locations.deleteConfirm', { name: loc.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(loc.id);
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            }
          },
        },
      ]
    );
  };

  const maxLocations = user?.is_premium ? 999 : 2;
  const canAddMore = locations.length < maxLocations;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('locations.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {t('locations.infoText')}
          </Text>
        </View>

        {/* Location List */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: SPACING.xxl }}
          />
        ) : locations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="location-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('locations.noLocations')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('locations.addFirst')}
            </Text>
          </View>
        ) : (
          <View style={[styles.locationsList, { backgroundColor: colors.card }, SHADOWS.small]}>
            {locations.map((loc, index) => (
              <View key={loc.id}>
                <View style={styles.locationItem}>
                  <View style={[styles.locationIcon, { backgroundColor: COLORS.primary + '20' }]}>
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={[styles.locationName, { color: colors.text }]}>
                      {loc.name}
                    </Text>
                    {loc.address ? (
                      <Text
                        style={[styles.locationAddress, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {loc.address}
                      </Text>
                    ) : null}
                    {loc.latitude && loc.longitude ? (
                      <View style={styles.coordsBadge}>
                        <Ionicons name="navigate" size={10} color={COLORS.success} />
                        <Text style={styles.coordsText}>{t('locations.gpsLinked')}</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteLocation(loc)}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
                {index < locations.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Limit Info */}
        {!user?.is_premium && (
          <View style={styles.limitInfo}>
            <Text style={[styles.limitText, { color: colors.textSecondary }]}>
              {t('locations.freeLimit', { count: locations.length, max: maxLocations })}
            </Text>
            <TouchableOpacity onPress={() => router.push('/paywall')}>
              <Text style={[styles.upgradeLink, { color: COLORS.premium }]}>
                {t('locations.upgradeForMore')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      {canAddMore && (
        <View style={[styles.footer, { backgroundColor: colors.card }, SHADOWS.medium]}>
          <Button
            title={t('locations.addLocation')}
            onPress={() => setShowAddModal(true)}
            size="large"
            style={{ flex: 1 }}
            icon={<Ionicons name="add" size={24} color="#fff" />}
          />
        </View>
      )}

      {/* Add Location Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('locations.addLocation')}
            </Text>

            {/* Location Name */}
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.background, color: colors.text },
              ]}
              placeholder={t('locations.locationName')}
              placeholderTextColor={colors.textSecondary}
              value={newLocationName}
              onChangeText={setNewLocationName}
              autoFocus
            />

            {/* GPS Detection */}
            <TouchableOpacity
              style={[
                styles.gpsButton,
                {
                  backgroundColor: newCoords ? COLORS.success + '15' : colors.background,
                  borderColor: newCoords ? COLORS.success : colors.border,
                },
              ]}
              onPress={handleDetectLocation}
              disabled={detectingGPS}
            >
              {detectingGPS ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name={newCoords ? 'checkmark-circle' : 'navigate'}
                  size={20}
                  color={newCoords ? COLORS.success : COLORS.primary}
                />
              )}
              <Text
                style={[
                  styles.gpsButtonText,
                  {
                    color: newCoords ? COLORS.success : COLORS.primary,
                  },
                ]}
              >
                {newCoords
                  ? t('locations.locationDetected')
                  : t('locations.detectGPS')}
              </Text>
            </TouchableOpacity>

            {/* Address (auto-filled or manual) */}
            {newAddress ? (
              <View style={styles.addressPreview}>
                <Ionicons name="location" size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.addressText, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {newAddress}
                </Text>
              </View>
            ) : null}

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                onPress={() => {
                  setShowAddModal(false);
                  setNewLocationName('');
                  setNewAddress('');
                  setNewCoords(null);
                }}
                variant="outline"
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <Button
                title={t('common.save')}
                onPress={handleSaveLocation}
                loading={saving}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  locationsList: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  coordsText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  limitInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  limitText: {
    fontSize: FONTS.sizes.sm,
  },
  upgradeLink: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
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
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  gpsButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addressText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});
