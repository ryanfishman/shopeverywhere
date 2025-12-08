"use client";

import { useEffect, useMemo, useState } from "react";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";
import { getLocalizedName } from "@/lib/i18n";

// Import API services
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategoryById,
  flattenCategoryTree,
  filterCategoriesBySearch,
} from "@/lib/api";
import type { AdminCategoryNode } from "@/lib/api";

// Import components
import {
  CategorySidebar,
  CategoryForm,
  AddCategoryModal,
  DeleteCategoryModal,
} from "@/components/admin/categories";

export default function AdminCategoriesPage() {
  const { locale } = usePreferredLocale();

  // Category data
  const [categories, setCategories] = useState<AdminCategoryNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // UI state
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryNode | null>(null);

  // Derived state
  const flatMap = useMemo(() => flattenCategoryTree(categories), [categories]);
  const selectedCategory = selectedId ? flatMap.get(selectedId) || null : null;
  const parentCategory = addParentId ? flatMap.get(addParentId) || null : null;

  const filteredCategories = useMemo(
    () => filterCategoriesBySearch(categories, search, locale, getLocalizedName),
    [categories, search, locale]
  );

  // Fetch categories
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCategories();
      setCategories(data.categories || []);
      if (!selectedId && data.categories?.[0]) {
        setSelectedId(data.categories[0].id);
        setTranslations(data.categories[0].nameTranslations || {});
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCategories();
  }, []);

  // Update translations when selection changes
  useEffect(() => {
    if (selectedId) {
      const cat = flatMap.get(selectedId);
      setTranslations(cat?.nameTranslations || {});
    }
  }, [selectedId, flatMap]);

  // Handlers
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = (parentId: string | null = null) => {
    setAddParentId(parentId);
    setNewCategoryName("");
    setShowAddModal(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(newCategoryName, addParentId);
      await loadCategories();
    } catch (error) {
      console.error("Error creating category:", error);
    }
    setNewCategoryName("");
    setShowAddModal(false);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategoryById(categoryToDelete.id);
      if (selectedId === categoryToDelete.id) {
        setSelectedId(null);
        setTranslations({});
      }
      await loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
    setCategoryToDelete(null);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateCategory(selectedId, translations);
      await loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex gap-6 h-full">
      {/* Sidebar */}
      <CategorySidebar
        categories={filteredCategories}
        selectedId={selectedId}
        search={search}
        expanded={expanded}
        locale={locale}
        loading={loading}
        isOpen={mobileSidebarOpen}
        onSearchChange={setSearch}
        onSelect={setSelectedId}
        onToggleExpand={toggleExpand}
        onAddRoot={() => openAddModal(null)}
        onAddChild={openAddModal}
        onDelete={setCategoryToDelete}
        onClose={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main content */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <CategoryForm
          category={selectedCategory}
          translations={translations}
          locale={locale}
          saving={saving}
          onTranslationChange={setTranslations}
          onSave={handleSave}
          onDelete={setCategoryToDelete}
        />
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={showAddModal}
        parentId={addParentId}
        parentCategory={parentCategory}
        categoryName={newCategoryName}
        locale={locale}
        onCategoryNameChange={setNewCategoryName}
        onAdd={handleAddCategory}
        onClose={() => {
          setShowAddModal(false);
          setNewCategoryName("");
        }}
      />

      <DeleteCategoryModal
        category={categoryToDelete}
        locale={locale}
        onDelete={handleDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
