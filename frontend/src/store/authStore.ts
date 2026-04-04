import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  is_premium: boolean;
  is_guest: boolean;
  created_at: string;
  total_exits: number;
  total_items_saved: number;
  total_forgotten: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  activatePremium: () => Promise<void>;
  deactivatePremium: () => Promise<void>;
  isPremiumUser: () => boolean;
}

// Safe storage operations
const safeSetItem = async (key: string, value: string) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('Storage setItem failed:', e);
  }
};

const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn('Storage getItem failed:', e);
    return null;
  }
};

const safeRemoveItem = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('Storage removeItem failed:', e);
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      await safeSetItem('forgetly_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      set({ user, token: access_token, isAuthenticated: true });
      console.log('[Auth] Login success, premium:', user.is_premium);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },
  
  register: async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      const { access_token, user } = response.data;
      
      await safeSetItem('forgetly_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      set({ user, token: access_token, isAuthenticated: true });
      console.log('[Auth] Register success, premium:', user.is_premium);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },
  
  guestLogin: async () => {
    try {
      const response = await api.post('/auth/guest');
      const { access_token, user } = response.data;
      
      await safeSetItem('forgetly_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Guest users are ALWAYS free
      user.is_premium = false;
      set({ user, token: access_token, isAuthenticated: true });
      console.log('[Auth] Guest login, premium: false (enforced)');
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Guest login failed');
    }
  },
  
  logout: async () => {
    await safeRemoveItem('forgetly_token');
    await safeRemoveItem('forgetly_premium');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
    console.log('[Auth] Logged out, premium state cleared');
  },
  
  loadToken: async () => {
    try {
      const token = await safeGetItem('forgetly_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        const userData = response.data;
        
        // Restore local premium status
        const localPremium = await safeGetItem('forgetly_premium');
        if (localPremium === 'true' && !userData.is_guest) {
          userData.is_premium = true;
        }
        // Guest users are ALWAYS free regardless of DB state
        if (userData.is_guest) {
          userData.is_premium = false;
        }
        
        set({ user: userData, token, isAuthenticated: true, isLoading: false });
        console.log('[Auth] Token loaded, premium:', userData.is_premium, 'guest:', userData.is_guest);
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await safeRemoveItem('forgetly_token');
      set({ isLoading: false });
    }
  },
  
  refreshUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      const currentUser = get().user;
      
      // Preserve local premium override for non-guests
      if (currentUser?.is_premium && !userData.is_guest) {
        userData.is_premium = true;
      }
      // Guest = always free
      if (userData.is_guest) {
        userData.is_premium = false;
      }
      
      set({ user: userData });
      console.log('[Auth] User refreshed, premium:', userData.is_premium);
    } catch (error) {
      console.error('[Auth] Failed to refresh user:', error);
    }
  },
  
  updateProfile: async (name: string) => {
    try {
      const response = await api.put('/auth/profile', { name });
      set({ user: response.data });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Update failed');
    }
  },

  activatePremium: async () => {
    try {
      console.log('[Premium] Activating premium...');
      
      // 1. Call backend to persist
      await api.post('/premium/activate');
      console.log('[Premium] Backend activated');
      
      // 2. Persist locally
      await safeSetItem('forgetly_premium', 'true');
      console.log('[Premium] Local storage set');
      
      // 3. Update Zustand state immediately (triggers re-render everywhere)
      const currentUser = get().user;
      if (currentUser) {
        const updatedUser = { ...currentUser, is_premium: true };
        set({ user: updatedUser });
        console.log('[Premium] State updated - all screens will re-render');
      }
      
      // 4. Refresh from backend to confirm
      const response = await api.get('/auth/me');
      const serverUser = response.data;
      serverUser.is_premium = true; // Ensure it's set
      set({ user: serverUser });
      console.log('[Premium] Confirmed from server, premium:', serverUser.is_premium);
      
    } catch (error: any) {
      console.error('[Premium] Activation failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to activate premium');
    }
  },

  deactivatePremium: async () => {
    try {
      await api.post('/premium/deactivate');
      await safeRemoveItem('forgetly_premium');
      
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, is_premium: false } });
      }
      console.log('[Premium] Deactivated');
    } catch (error: any) {
      console.error('[Premium] Deactivation failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to deactivate premium');
    }
  },

  isPremiumUser: () => {
    const user = get().user;
    // Guest users are NEVER premium
    if (!user || user.is_guest) return false;
    return user.is_premium === true;
  },
}));
