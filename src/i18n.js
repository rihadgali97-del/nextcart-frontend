import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend'; // ◄ Imported Backend Loader

i18n
  .use(HttpBackend) // ◄ Tells i18next to load translations over HTTP paths
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false, // Set to true to see path loading logs in your browser console

    backend: {
      // Points exactly to your public locales directory folder layout structure
      loadPath: '/locales/{{lng}}/translation.json',
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;