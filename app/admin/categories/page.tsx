"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { LANGUAGES, getLocalizedName } from "@/lib/i18n";
import { Plus, Trash2, Save, ChevronRight, ChevronDown, Loader2, Search } from "lucide-react";
import { t } from "@/translations/translations";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";

type CategoryNode = {
  id: string;
  parentId: string | null;
  nameTranslations: Record<string, string>;
  children: CategoryNode[];
};

const flatten = (nodes: CategoryNode[]) => {
  const map = new Map<string, CategoryNode>();
  const traverse = (list: CategoryNode[]) => {
    list.forEach((node) => {
      map.set(node.id, node);
      if (node.children?.length) traverse(node.children);
    });
  };
  traverse(nodes);
  return map;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { locale } = usePreferredLocale();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryNode | null>(null);

  const flatMap = useMemo(() => flatten(categories), [categories]);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories || []);
      if (!selectedId && data.categories?.[0]) {
        setSelectedId(data.categories[0].id);
        setTranslations(data.categories[0].nameTranslations || {});
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const cat = flatMap.get(selectedId);
      setTranslations(cat?.nameTranslations || {});
    }
  }, [selectedId, flatMap]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const lower = search.toLowerCase();
    const filterNode = (node: CategoryNode): CategoryNode | null => {
      const label = getLocalizedName(node.nameTranslations, locale).toLowerCase();
      const childMatches = node.children
        .map(filterNode)
        .filter((child): child is CategoryNode => Boolean(child));
      if (label.includes(lower) || childMatches.length) {
        return { ...node, children: childMatches };
      }
      return null;
    };
    return categories
      .map(filterNode)
      .filter((node): node is CategoryNode => Boolean(node));
  }, [categories, search, locale]);

  const openAddModal = (parentId?: string | null) => {
    setAddParentId(parentId || null);
    setNewCategoryName("");
    setShowAddModal(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId: addParentId,
        translations: {
          en: newCategoryName,
        },
      }),
    });
    if (res.ok) {
      await fetchCategories();
    }
    setNewCategoryName("");
    setShowAddModal(false);
  };

  const handleDelete = async (category: CategoryNode) => {
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedId === category.id) {
        setSelectedId(null);
        setTranslations({});
      }
      await fetchCategories();
    }
    setCategoryToDelete(null);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translations }),
    });
    if (res.ok) {
      await fetchCategories();
    }
    setSaving(false);
  };

  const renderTree = (nodes: CategoryNode[], depth = 0) => (
    <ul className="space-y-1">
      {nodes.map((node) => {
        const isSelected = selectedId === node.id;
        const hasChildren = node.children?.length > 0;
        const isExpanded = expanded[node.id] ?? true;
        const label = getLocalizedName(node.nameTranslations, locale);
        return (
          <li key={node.id}>
            <div
              className={`flex items-center gap-1 rounded-xl text-sm transition-all ${
                isSelected 
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60" 
                  : "hover:bg-slate-50"
              }`}
            >
              {hasChildren ? (
                <button onClick={() => toggleExpand(node.id)} className="p-2 text-slate-400 hover:text-slate-600">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="w-8" />
              )}
              <button 
                onClick={() => setSelectedId(node.id)} 
                className={`flex-1 text-left py-2 font-medium ${isSelected ? "text-amber-700" : "text-slate-700"}`}
                style={{ marginLeft: depth * 4 }}
              >
                {label}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openAddModal(node.id); }}
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title={t(locale, "add")}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCategoryToDelete(node); }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-1"
                title={t(locale, "delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-4 border-l-2 border-slate-100 pl-2">
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const selectedCategory = selectedId ? flatMap.get(selectedId) : null;

  return (
    <div className="relative flex gap-6 h-full">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}
      <button
        className="md:hidden fixed left-0 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center h-14 w-7 rounded-r-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open categories panel"
      >
        <span className="sr-only">Open categories</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        className={clsx(
          "w-72 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 flex flex-col transition-all",
          "md:static md:flex",
          mobileSidebarOpen ? "fixed inset-0 left-0 z-60 shadow-2xl md:shadow-none" : "hidden md:flex"
        )}
      >
        <div className="md:hidden flex justify-between items-center mb-3">
          <span className="font-bold text-slate-800">{t(locale, "categories")}</span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
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
              placeholder={t(locale, "searchCategories")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => openAddModal(null)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
            title={t(locale, "add")}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {t(locale, "loading")}
            </div>
          ) : (
            renderTree(filteredCategories)
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        {!selectedCategory ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            {t(locale, "selectCategoryToEdit")}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {getLocalizedName(selectedCategory.nameTranslations, locale)}
              </h2>
              <button
                onClick={() => setCategoryToDelete(selectedCategory)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t(locale, "delete")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LANGUAGES.map((lang) => (
                <div key={lang} className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{lang}</label>
                  <input
                    type="text"
                    value={translations[lang] || ""}
                    onChange={(e) =>
                      setTranslations((prev) => ({
                        ...prev,
                        [lang]: e.target.value,
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder={`${t(locale, "name")} (${lang.toUpperCase()})`}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:from-slate-700 hover:to-slate-600 shadow-lg disabled:opacity-70 transition-all"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t(locale, "saveChanges")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {addParentId ? t(locale, "addChildCategory") : t(locale, "addCategory")}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Parent category info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {t(locale, "addingCategoryTo")}
                </p>
                <p className="font-semibold text-slate-800">
                  {addParentId 
                    ? getLocalizedName(flatMap.get(addParentId)?.nameTranslations || {}, locale)
                    : t(locale, "rootCategory")
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t(locale, "categoryName")}
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t(locale, "enterCategoryName")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => { setShowAddModal(false); setNewCategoryName(""); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                {t(locale, "cancel")}
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
              >
                {t(locale, "add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {t(locale, "deleteCategory")}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                {t(locale, "deleteCategoryConfirm")}
              </p>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="font-semibold text-red-800">
                  {getLocalizedName(categoryToDelete.nameTranslations, locale)}
                </p>
                {categoryToDelete.children?.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    {t(locale, "categoryHasChildren")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                {t(locale, "cancel")}
              </button>
              <button
                onClick={() => handleDelete(categoryToDelete)}
                className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all"
              >
                {t(locale, "delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

