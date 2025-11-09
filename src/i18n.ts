import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import ar from './locales/ar.json';

// Get stored language from localStorage, default to 'en' if not found
const storedLanguage = localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: en,
      },
      ar: {
        translation: ar,
      },
    },
    lng: storedLanguage, // Use the stored language
    fallbackLng: 'en', // fallback language if translation is missing
    defaultNS: 'translation', // Use 'translation' as the default namespace
    ns: ['translation'], // Only use the default namespace
    returnNull: false, // Crucial: ensures fallback text is shown instead of null/raw key
    keySeparator: false, // Treat keys containing dots/underscores as plain keys
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false, // Disable suspense for easier integration
    }
  });

export default i18n;