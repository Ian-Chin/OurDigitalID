import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ms from './locales/ms.json';
import cn from './locales/cn.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'en',                // default language
  fallbackLng: 'en',        // fallback if key missing
  resources: {
    en: { translation: en },
    ms: { translation: ms },
    cn: { translation: cn },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;