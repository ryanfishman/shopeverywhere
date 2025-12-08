import { commonTranslations } from "./common";
import { zonesTranslations } from "./zones";
import { storesTranslations } from "./stores";
import { usersTranslations } from "./users";
import { categoriesTranslations } from "./categories";

export const translations = {
  en: {
    ...commonTranslations.en,
    ...zonesTranslations.en,
    ...storesTranslations.en,
    ...usersTranslations.en,
    ...categoriesTranslations.en,
  },
  fr: {
    ...commonTranslations.fr,
    ...zonesTranslations.fr,
    ...storesTranslations.fr,
    ...usersTranslations.fr,
    ...categoriesTranslations.fr,
  },
  es: {
    ...commonTranslations.es,
    ...zonesTranslations.es,
    ...storesTranslations.es,
    ...usersTranslations.es,
    ...categoriesTranslations.es,
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export const t = (locale: string, key: TranslationKey): string => {
  const lang = locale as keyof typeof translations;
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  return translations.en[key] || key;
};


