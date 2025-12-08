"use client";

import { X, Filter, Building2 } from "lucide-react";
import { Store } from "./types";

interface StoreFilterProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  selectedStoreIds: Set<string>;
  onToggleStore: (storeId: string) => void;
  onToggleAll: () => void;
  onApply: () => void;
  onClear: () => void;
  t: (key: string) => string;
}

export const StoreFilter = ({
  isOpen,
  onClose,
  stores,
  selectedStoreIds,
  onToggleStore,
  onToggleAll,
  onApply,
  onClear,
  t,
}: StoreFilterProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('filterStore')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {stores.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No stores available</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border-b border-slate-100 mb-2">
                <input
                  type="checkbox"
                  checked={selectedStoreIds.size === stores.length && stores.length > 0}
                  onChange={onToggleAll}
                  className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="font-semibold text-slate-800">{t('selectAll')}</span>
                <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {stores.length} stores
                </span>
              </label>

              {/* Store List */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {stores.map(store => (
                  <label
                    key={store.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.has(store.id)}
                      onChange={() => onToggleStore(store.id)}
                      className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{store.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClear}
            disabled={selectedStoreIds.size === 0}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('clear')}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {selectedStoreIds.size > 0
                ? `${selectedStoreIds.size} selected`
                : 'Showing all stores'
              }
            </span>
            <button
              onClick={onApply}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FilterButtonProps {
  onClick: () => void;
  activeCount: number;
  title: string;
}

export const FilterButton = ({ onClick, activeCount, title }: FilterButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2.5 rounded-xl transition-colors ${
        activeCount > 0
          ? 'bg-amber-500 text-white'
          : 'hover:bg-white/10 text-white/70 hover:text-white'
      }`}
      title={title}
    >
      <Filter size={20} />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export const MobileFilterButton = ({ onClick, activeCount, title }: FilterButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2.5 rounded-xl transition-colors flex-shrink-0 ${
        activeCount > 0
          ? 'bg-amber-500 text-white'
          : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
      }`}
      title={title}
    >
      <Filter size={20} />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {activeCount}
        </span>
      )}
    </button>
  );
};

