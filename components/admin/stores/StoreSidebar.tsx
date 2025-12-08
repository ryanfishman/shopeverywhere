"use client";

import { useState } from "react";
import clsx from "clsx";
import { Plus, Search, SlidersHorizontal, Loader2, Trash2 } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import type { StoreRecord } from "./types";

interface StoreSidebarProps {
  stores: StoreRecord[];
  selectedId: string | null;
  locale: string;
  loading: boolean;
  saving: boolean;
  onSelect: (store: StoreRecord) => void;
  onAdd: () => void;
  onDelete: (store: StoreRecord) => void;
  onSearch: (query: string) => void;
}

export function StoreSidebar({
  stores,
  selectedId,
  locale,
  loading,
  saving,
  onSelect,
  onAdd,
  onDelete,
  onSearch,
}: StoreSidebarProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

  const handleSelect = (store: StoreRecord) => {
    onSelect(store);
    setMobileSidebarOpen(false);
  };

  // Filter stores based on search
  const filteredStores = search
    ? stores.filter((store) =>
        getLocalizedName(store.nameTranslations, locale, store.name)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : stores;

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed left-0 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center h-14 w-7 rounded-r-full bg-indigo-600 text-white shadow-lg"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open stores panel"
      >
        <span className="sr-only">Open stores</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          "w-72 bg-white border border-gray-200 rounded-lg p-4 flex flex-col transition-all",
          "md:static md:flex",
          mobileSidebarOpen ? "fixed inset-0 left-0 z-60 shadow-2xl md:shadow-none" : "hidden md:flex"
        )}
      >
        {/* Mobile header */}
        <div className="md:hidden flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-800">Stores</span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        {/* Search and actions */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-[160px] border rounded-md px-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border-none focus:ring-0 text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="p-2 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={onAdd}
              disabled={saving}
              className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters placeholder */}
        {showFilters && (
          <div className="mb-3 rounded-md border border-dashed border-gray-300 p-3 text-xs text-gray-500">
            Advanced filters coming soon.
          </div>
        )}

        {/* Store list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            filteredStores.map((store) => {
              const label = getLocalizedName(store.nameTranslations, locale, store.name);
              const isSelected = store.id === selectedId;
              return (
                <div
                  key={store.id}
                  className={`w-full px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                    isSelected ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <button className="text-left flex-1" onClick={() => handleSelect(store)}>
                    {label}
                    <p className="text-xs text-gray-400">{store.city || store.country || "No address"}</p>
                  </button>
                  <button
                    onClick={() => onDelete(store)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    aria-label="Delete store"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

