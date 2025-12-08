"use client";

import { Save, Loader2, Trash2 } from "lucide-react";
import { LANGUAGES, getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { AdminCategoryNode } from "./types";

interface CategoryFormProps {
  category: AdminCategoryNode | null;
  translations: Record<string, string>;
  locale: string;
  saving: boolean;
  onTranslationChange: (translations: Record<string, string>) => void;
  onSave: () => void;
  onDelete: (category: AdminCategoryNode) => void;
}

export function CategoryForm({
  category,
  translations,
  locale,
  saving,
  onTranslationChange,
  onSave,
  onDelete,
}: CategoryFormProps) {
  if (!category) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        {t(locale, "selectCategoryToEdit")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          {getLocalizedName(category.nameTranslations, locale)}
        </h2>
        <button
          onClick={() => onDelete(category)}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {t(locale, "delete")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {LANGUAGES.map((lang) => (
          <div key={lang} className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {lang}
            </label>
            <input
              type="text"
              value={translations[lang] || ""}
              onChange={(e) =>
                onTranslationChange({
                  ...translations,
                  [lang]: e.target.value,
                })
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
              placeholder={`${t(locale, "name")} (${lang.toUpperCase()})`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:from-slate-700 hover:to-slate-600 shadow-lg disabled:opacity-70 transition-all"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t(locale, "saveChanges")}
        </button>
      </div>
    </div>
  );
}

