"use client";

import { t } from "@/translations/translations";

interface AddZoneModalProps {
  isOpen: boolean;
  zoneName: string;
  onZoneNameChange: (name: string) => void;
  onAdd: () => void;
  onClose: () => void;
  locale: string;
}

export const AddZoneModal = ({
  isOpen,
  zoneName,
  onZoneNameChange,
  onAdd,
  onClose,
  locale,
}: AddZoneModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">
            {t(locale, "addZone")}
          </h3>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t(locale, "zoneName")}
          </label>
          <input
            type="text"
            value={zoneName}
            onChange={(e) => onZoneNameChange(e.target.value)}
            placeholder={t(locale, "zoneNamePrompt")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
          />
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
            disabled={!zoneName.trim()}
            className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
          >
            {t(locale, "add")}
          </button>
        </div>
      </div>
    </div>
  );
};

