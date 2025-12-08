"use client";

import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { AdminCategoryNode } from "./types";

interface AddCategoryModalProps {
  isOpen: boolean;
  parentId: string | null;
  parentCategory: AdminCategoryNode | null;
  categoryName: string;
  locale: string;
  onCategoryNameChange: (name: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

export function AddCategoryModal({
  isOpen,
  parentId,
  parentCategory,
  categoryName,
  locale,
  onCategoryNameChange,
  onAdd,
  onClose,
}: AddCategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">
            {parentId ? t(locale, "addChildCategory") : t(locale, "addCategory")}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Parent category info */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              {t(locale, "addingCategoryTo")}
            </p>
            <p className="font-semibold text-slate-800">
              {parentCategory
                ? getLocalizedName(parentCategory.nameTranslations, locale)
                : t(locale, "rootCategory")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t(locale, "categoryName")}
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => onCategoryNameChange(e.target.value)}
              placeholder={t(locale, "enterCategoryName")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && onAdd()}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            {t(locale, "cancel")}
          </button>
          <button
            onClick={onAdd}
            disabled={!categoryName.trim()}
            className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
          >
            {t(locale, "add")}
          </button>
        </div>
      </div>
    </div>
  );
}

