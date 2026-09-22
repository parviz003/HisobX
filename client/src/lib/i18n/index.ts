import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uzCommon from '@/locales/uz/common.json';
import uzErrors from '@/locales/uz/errors.json';
import uzNav from '@/locales/uz/nav.json';
import uzAuth from '@/locales/uz/auth.json';

import ruCommon from '@/locales/ru/common.json';
import ruErrors from '@/locales/ru/errors.json';
import ruNav from '@/locales/ru/nav.json';
import ruAuth from '@/locales/ru/auth.json';

export const SUPPORTED_LANGUAGES = ['uz', 'ru'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'hisobx-language';

/** Namespace'lar feature bo'yicha ajratilgan — yangi bo'lim qo'shilsa shu yerga qo'shiladi. */
export const resources = {
  uz: { common: uzCommon, errors: uzErrors, nav: uzNav, auth: uzAuth },
  ru: { common: ruCommon, errors: ruErrors, nav: ruNav, auth: ruAuth },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: 'common',
    ns: ['common', 'errors', 'nav', 'auth'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
