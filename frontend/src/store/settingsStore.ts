import { create } from 'zustand';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage, isRTL } from '../i18n';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ar' | 'ur' | 'tr' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'hi' | 'id' | 'ru' | 'zh' | 'ja' | 'ko';

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
  geofencingEnabled: boolean;
  smartSuggestionsEnabled: boolean;
  isRTL: boolean;
  isLoading: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setVoiceEnabled: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setGeofencingEnabled: (enabled: boolean) => Promise<void>;
  setSmartSuggestionsEnabled: (enabled: boolean) => Promise<void>;
}

const SETTINGS_KEY = '@forgetly_settings';

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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'system',
  language: 'en',
  voiceEnabled: true,
  notificationsEnabled: true,
  geofencingEnabled: true,
  smartSuggestionsEnabled: true,
  isRTL: false,
  isLoading: true,
  
  loadSettings: async () => {
    try {
      const stored = await safeGetItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        const rtl = isRTL(settings.language || 'en');
        set({
          theme: settings.theme || 'system',
          language: settings.language || 'en',
          voiceEnabled: settings.voiceEnabled ?? true,
          notificationsEnabled: settings.notificationsEnabled ?? true,
          geofencingEnabled: settings.geofencingEnabled ?? true,
          smartSuggestionsEnabled: settings.smartSuggestionsEnabled ?? true,
          isRTL: rtl,
          isLoading: false,
        });
        await changeLanguage(settings.language || 'en');
      } else {
        set({ isLoading: false });
        await changeLanguage('en');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },
  
  setTheme: async (theme) => {
    set({ theme });
    await saveSettings(get());
  },
  
  setLanguage: async (language) => {
    const rtl = isRTL(language);
    set({ language, isRTL: rtl });
    await changeLanguage(language);
    await saveSettings(get());
    
    // Handle RTL on native platforms
    if (Platform.OS !== 'web') {
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
      }
    }
  },
  
  setVoiceEnabled: async (voiceEnabled) => {
    set({ voiceEnabled });
    await saveSettings(get());
  },
  
  setNotificationsEnabled: async (notificationsEnabled) => {
    set({ notificationsEnabled });
    await saveSettings(get());
  },

  setGeofencingEnabled: async (geofencingEnabled) => {
    set({ geofencingEnabled });
    await saveSettings(get());
  },

  setSmartSuggestionsEnabled: async (smartSuggestionsEnabled) => {
    set({ smartSuggestionsEnabled });
    await saveSettings(get());
  },
}));

const saveSettings = async (state: SettingsState) => {
  try {
    const settings = {
      theme: state.theme,
      language: state.language,
      voiceEnabled: state.voiceEnabled,
      notificationsEnabled: state.notificationsEnabled,
      geofencingEnabled: state.geofencingEnabled,
      smartSuggestionsEnabled: state.smartSuggestionsEnabled,
    };
    await safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};
