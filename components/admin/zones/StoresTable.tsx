"use client";

import { Search, MapPin } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { StoreInfo } from "@/lib/api";

interface StoresTableProps {
  stores: StoreInfo[];
  search: string;
  onSearchChange: (value: string) => void;
  onToggleStore: (store: StoreInfo) => void;
  locale: string;
}

export const StoresTable = ({
  stores,
  search,
  onSearchChange,
  onToggleStore,
  locale,
}: StoresTableProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">{t(locale, "stores")}</h3>
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 border border-slate-200/60">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t(locale, "searchStores")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm py-2 placeholder-slate-400"
          />
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-gray-500 uppercase text-xs">
              <th className="py-2">{t(locale, "name")}</th>
              <th className="py-2">{t(locale, "status")}</th>
              <th className="py-2">{t(locale, "action")}</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-t hover:bg-gray-50">
                <td className="py-2">
                  <div className="font-medium text-gray-900">
                    {getLocalizedName(store.nameTranslations, locale, store.name)}
                  </div>
                  <div className="text-xs text-gray-500">{store.address}</div>
                </td>
                <td className="py-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                      store.inZone ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <MapPin className="h-3 w-3" />
                    {store.inZone ? t(locale, "inZone") : t(locale, "outside")}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => onToggleStore(store)}
                    className={`text-sm font-medium ${
                      store.inZone ? "text-red-600" : "text-indigo-600"
                    } hover:underline`}
                  >
                    {store.inZone ? t(locale, "remove") : t(locale, "add")}
                  </button>
                </td>
              </tr>
            ))}
            {!stores.length && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-sm text-gray-400">
                  {t(locale, "noStoresFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

