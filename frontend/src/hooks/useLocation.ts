import { useState, useEffect, useCallback } from 'react';
import * as ExpoLocation from 'expo-location';
import { Alert, Platform } from 'react-native';
import { useLocationStore } from '../store/locationStore';

export const useLocation = () => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentLocation } = useLocationStore();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Location Permission',
            'Please enable location access in your device settings to use location features.',
          );
        }
        setIsLoading(false);
        return null;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (error) {
      console.error('Get location error:', error);
      setIsLoading(false);
      return null;
    }
  }, [requestPermission, setCurrentLocation]);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<string> => {
      try {
        const results = await ExpoLocation.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (results.length > 0) {
          const addr = results[0];
          const parts = [
            addr.street,
            addr.city,
            addr.region,
          ].filter(Boolean);
          return parts.join(', ') || 'Unknown Address';
        }
        return 'Unknown Address';
      } catch {
        return 'Unknown Address';
      }
    },
    []
  );

  return {
    permissionStatus,
    isLoading,
    requestPermission,
    getCurrentPosition,
    reverseGeocode,
  };
};
