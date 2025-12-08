"use client";

import { Search, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { ZoneSummary } from "@/lib/api";

interface ZoneSidebarProps {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectZone: (zoneId: string) => void;
  onAddZone: () => void;
  onDeleteZone: (zone: ZoneSummary) => void;
  locale: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ZoneSidebar = ({
  zones,
  selectedZoneId,
  search,
  onSearchChange,
  onSelectZone,
  onAddZone,
  onDeleteZone,
  locale,
  isOpen,
  onClose,
}: ZoneSidebarProps) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Mobile open tab */}
      <button
        className="md:hidden fixed left-0 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center h-14 w-7 rounded-r-full bg-indigo-600 text-white shadow-lg"
        onClick={() => onClose()}
        aria-label="Open zones panel"
      >
        <span className="sr-only">Open zones</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          "bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 flex flex-col transition-all",
          "md:w-72 md:static md:flex",
          isOpen ? "fixed inset-0 left-0 z-60 w-72 shadow-2xl md:shadow-none" : "hidden md:flex"
        )}
      >
        {/* Mobile close */}
        <div className="md:hidden flex justify-between items-center mb-3">
          <span className="font-bold text-slate-800">{t(locale, "zones")}</span>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t(locale, "cancel")}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 border border-slate-200/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t(locale, "searchZones")}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 placeholder-slate-400"
            />
          </div>
          <button
            onClick={onAddZone}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
            title={t(locale, "addZone")}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {zones.map((zone) => {
            const name = getLocalizedName(zone.nameTranslations, locale, zone.name);
            return (
              <div
                key={zone.id}
                className={`flex items-center gap-1 rounded-xl text-sm transition-all ${
                  zone.id === selectedZoneId
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60"
                    : "hover:bg-slate-50"
                }`}
              >
                <button
                  onClick={() => onSelectZone(zone.id)}
                  className={`flex-1 text-left px-3 py-2.5 font-medium ${
                    zone.id === selectedZoneId ? "text-amber-700" : "text-slate-700"
                  }`}
                >
                  {name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteZone(zone);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-1"
                  title={t(locale, "deleteZone")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {!zones.length && (
            <p className="text-sm text-slate-400 text-center py-6">{t(locale, "noZonesFound")}</p>
          )}
        </div>
      </div>
    </>
  );
};

