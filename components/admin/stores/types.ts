/**
 * Types for Admin Stores components
 */

import { LANGUAGES } from "@/lib/i18n";

// Re-export from API for convenience
export type {
  StoreRecord,
  CategoryNode,
  ProductRecord,
  StoreFormData,
  ProductEditorState,
} from "@/lib/api/admin-stores";

// Helper to create blank translations object
export const blankTranslations = (): Record<string, string> =>
  LANGUAGES.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = "";
    return acc;
  }, {});

// Helper to create blank product editor state
export const createBlankProductEditor = (categoryId: string) => ({
  mode: "create" as const,
  categoryId,
  translations: blankTranslations(),
  shortDescription: blankTranslations(),
  longDescription: blankTranslations(),
  imageUrl: "",
  file: null,
  price: "0",
});



