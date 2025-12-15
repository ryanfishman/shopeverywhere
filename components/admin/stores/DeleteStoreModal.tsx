"use client";

import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { StoreRecord } from "./types";

interface DeleteStoreModalProps {
  store: StoreRecord | null;
  locale: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteStoreModal({
  store,
  locale,
  onConfirm,
  onCancel,
}: DeleteStoreModalProps) {
  if (!store) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t(locale, "deleteStore")}</h3>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">{t(locale, "deleteStoreConfirm")}</p>
          <p className="text-sm font-semibold text-gray-900">
            {getLocalizedName(store.nameTranslations, locale, store.name)}
          </p>
          <p className="text-xs text-gray-500">
            {[store.address, store.city, store.country].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t(locale, "cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
          >
            {t(locale, "delete")}
          </button>
        </div>
      </div>
    </div>
  );
}



