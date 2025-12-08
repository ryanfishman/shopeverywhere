"use client";

import { Globe } from "lucide-react";

interface ZoneChangeWarningModalProps {
  isOpen: boolean;
  newZoneName?: string;
  resolvingLocation: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

export const ZoneChangeWarningModal = ({
  isOpen,
  newZoneName,
  resolvingLocation,
  onConfirm,
  onCancel,
  t,
}: ZoneChangeWarningModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Globe className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{t('zoneChangeWarning')}</h2>
          </div>
          <p className="text-slate-600 mb-6">{t('zoneChangeMessage')}</p>
          {newZoneName && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">New Zone:</p>
              <p className="font-semibold text-slate-800">{newZoneName}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              {t('cancelChange')}
            </button>
            <button
              onClick={onConfirm}
              disabled={resolvingLocation}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {resolvingLocation ? t('loading') : t('proceedWithChange')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

