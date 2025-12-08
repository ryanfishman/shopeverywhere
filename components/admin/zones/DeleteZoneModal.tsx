"use client";

import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { ZoneSummary } from "@/lib/api";

interface DeleteZoneModalProps {
  zone: ZoneSummary | null;
  onDelete: () => void;
  onClose: () => void;
  locale: string;
}

export const DeleteZoneModal = ({
  zone,
  onDelete,
  onClose,
  locale,
}: DeleteZoneModalProps) => {
  if (!zone) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">
            {t(locale, "deleteZone")}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            {t(locale, "deleteZoneConfirm")}
          </p>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="font-semibold text-red-800">
              {getLocalizedName(zone.nameTranslations, locale, zone.name)}
            </p>
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
            onClick={onDelete}
            className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all"
          >
            {t(locale, "delete")}
          </button>
        </div>
      </div>
    </div>
  );
};

