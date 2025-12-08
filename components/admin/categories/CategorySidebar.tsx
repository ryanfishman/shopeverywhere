"use client";

import { Search, Plus, Loader2 } from "lucide-react";
import clsx from "clsx";
import { t } from "@/translations/translations";
import { CategoryTree } from "./CategoryTree";
import type { AdminCategoryNode } from "./types";

interface CategorySidebarProps {
  categories: AdminCategoryNode[];
  selectedId: string | null;
  search: string;
  expanded: Record<string, boolean>;
  locale: string;
  loading: boolean;
  isOpen: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAddRoot: () => void;
  onAddChild: (parentId: string) => void;
  onDelete: (category: AdminCategoryNode) => void;
  onClose: () => void;
}

export function CategorySidebar({
  categories,
  selectedId,
  search,
  expanded,
  locale,
  loading,
  isOpen,
  onSearchChange,
  onSelect,
  onToggleExpand,
  onAddRoot,
  onAddChild,
  onDelete,
  onClose,
}: CategorySidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed left-0 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center h-14 w-7 rounded-r-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
        onClick={onClose}
        aria-label="Open categories panel"
      >
        <span className="sr-only">Open categories</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          "w-72 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 flex flex-col transition-all",
          "md:static md:flex",
          isOpen
            ? "fixed inset-0 left-0 z-60 shadow-2xl md:shadow-none"
            : "hidden md:flex"
        )}
      >
        {/* Mobile header */}
        <div className="md:hidden flex justify-between items-center mb-3">
          <span className="font-bold text-slate-800">
            {t(locale, "categories")}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t(locale, "cancel")}
          </button>
        </div>

        {/* Search and add */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 border border-slate-200/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t(locale, "searchCategories")}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 placeholder-slate-400"
            />
          </div>
          <button
            onClick={onAddRoot}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
            title={t(locale, "add")}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {t(locale, "loading")}
            </div>
          ) : (
            <CategoryTree
              categories={categories}
              selectedId={selectedId}
              expanded={expanded}
              locale={locale}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </>
  );
}

