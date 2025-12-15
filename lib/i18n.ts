export const LANGUAGES = ["en", "fr", "es"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export type TranslationMap = Record<string, string>;

export const normalizeTranslations = (value: any): TranslationMap => {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, val]) => typeof val === "string"
  ) as [string, string][];
  return entries.reduce<TranslationMap>((acc, [key, val]) => {
    acc[key] = val;
    return acc;
  }, {});
};

export const getLocalizedName = (
  translations: any,
  locale: string,
  fallback = "Unnamed"
) => {
  const map = normalizeTranslations(translations);
  if (map[locale]) return map[locale];
  if (map.en) return map.en;
  const first = Object.values(map)[0];
  return first || fallback;
};








