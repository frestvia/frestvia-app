import { create } from 'zustand';
import { api } from '../services/api';

export interface Location {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  checklist_id?: string;
  created_at: string;
}

interface LocationState {
  locations: Location[];
  currentLocation: { latitude: number; longitude: number } | null;
  nearbyLocation: Location | null;
  isLoading: boolean;

  // Actions
  fetchLocations: () => Promise<void>;
  createLocation: (data: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<Location>;
  deleteLocation: (id: string) => Promise<void>;
  setCurrentLocation: (coords: { latitude: number; longitude: number } | null) => void;
  findNearbyLocation: () => void;
}

const PROXIMITY_THRESHOLD_METERS = 200; // 200m radius

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: [],
  currentLocation: null,
  nearbyLocation: null,
  isLoading: false,

  fetchLocations: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/locations');
      set({ locations: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      set({ isLoading: false });
    }
  },

  createLocation: async (data) => {
    try {
      const response = await api.post('/locations', data);
      set((state) => ({ locations: [...state.locations, response.data] }));
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to create location');
    }
  },

  deleteLocation: async (id) => {
    try {
      await api.delete(`/locations/${id}`);
      set((state) => ({
        locations: state.locations.filter((l) => l.id !== id),
        nearbyLocation:
          state.nearbyLocation?.id === id ? null : state.nearbyLocation,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete location');
    }
  },

  setCurrentLocation: (coords) => {
    set({ currentLocation: coords });
    // Auto-find nearby location when current location updates
    if (coords) {
      get().findNearbyLocation();
    }
  },

  findNearbyLocation: () => {
    const { locations, currentLocation } = get();
    if (!currentLocation || locations.length === 0) {
      set({ nearbyLocation: null });
      return;
    }

    let closest: Location | null = null;
    let closestDistance = Infinity;

    for (const loc of locations) {
      if (loc.latitude && loc.longitude) {
        const distance = getDistanceInMeters(
          currentLocation.latitude,
          currentLocation.longitude,
          loc.latitude,
          loc.longitude
        );
        if (distance < PROXIMITY_THRESHOLD_METERS && distance < closestDistance) {
          closest = loc;
          closestDistance = distance;
        }
      }
    }

    set({ nearbyLocation: closest });
  },
}));
