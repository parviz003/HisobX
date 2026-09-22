import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n';

export function useLanguage() {
  const { i18n } = useTranslation();
  const current = (
    SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as Language)
      ? i18n.resolvedLanguage
      : 'uz'
  ) as Language;

  return {
    language: current,
    languages: SUPPORTED_LANGUAGES,
    // i18next detektori tanlovni localStorage'ga o'zi saqlaydi.
    setLanguage: (next: Language) => void i18n.changeLanguage(next),
  };
}
