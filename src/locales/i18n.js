import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import en from './en.json';
import ru from './ru.json';

const LANG_KEY = 'medhelp_language';

// Use same getApiUrl as SessionContext
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3000/api`;
  return 'http://10.0.2.2:3000/api';
};

// Start basic initialization synchronously so react-i18next doesn't crash on boot
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: 'en', // Will be overridden shortly
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export const getStoredLanguage = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(LANG_KEY);
    } else {
      return await SecureStore.getItemAsync(LANG_KEY);
    }
  } catch {
    return null;
  }
};

export const setAppLanguage = async (lng) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(LANG_KEY, lng);
    } else {
      await SecureStore.setItemAsync(LANG_KEY, lng);
    }
    await i18n.changeLanguage(lng);
  } catch (e) {
    console.error('Failed to change language:', e);
  }
};

const getSystemLanguage = () => {
  if (Platform.OS === 'web') {
    return navigator.language.split('-')[0];
  }
  // Simplified fallback; optionally use expo-localization for true multiplatform
  return 'en';
};

export const initLocalization = async () => {
  try {
    // 1. Determine local language
    let lang = await getStoredLanguage();
    if (!lang) {
      lang = getSystemLanguage();
      const available = ['en', 'ru'];
      if (!available.includes(lang)) lang = 'en';
      await setAppLanguage(lang);
    } else {
      await i18n.changeLanguage(lang);
    }

    // 2. Fetch remote translations
    const response = await fetch(`${getApiUrl()}/translations`);
    const json = await response.json();
    
    if (json.success && json.data) {
      // json.data is expected to be e.g. { en: { professions: { ... } }, ru: { ... } }
      Object.keys(json.data).forEach((lngCode) => {
        // Add resources deeply into the specific language
        i18n.addResourceBundle(lngCode, 'translation', json.data[lngCode], true, true);
      });
    }
  } catch (error) {
    console.error('Localization initialization failed:', error);
  }
};

export default i18n;
