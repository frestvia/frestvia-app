import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ar from './locales/ar.json';
import ur from './locales/ur.json';
import tr from './locales/tr.json';
import es from './locales/es.json';

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
];

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  ur: { translation: ur },
  tr: { translation: tr },
  es: { translation: es },
};

const LANGUAGE_KEY = '@forgetly_language';

export const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredLanguage = async (lang: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    console.error('Failed to save language preference');
  }
};

export const getDeviceLanguage = (): string => {
  const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
  // Check if device language is supported
  if (LANGUAGES.find(l => l.code === deviceLang)) {
    return deviceLang;
  }
  return 'en';
};

export const isRTL = (lang: string): boolean => {
  return LANGUAGES.find(l => l.code === lang)?.rtl || false;
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  await setStoredLanguage(lang);
};

export default i18n;
