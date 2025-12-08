"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import { Category } from "./types";

interface CategoryItemProps {
  category: Category;
  selectedCategory: string | null;
  onSelect: (id: string) => void;
  locale: string;
}

const CategoryItem = ({
  category,
  selectedCategory,
  onSelect,
  locale,
}: CategoryItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const label = getLocalizedName(category.nameTranslations, locale);

  const isChildSelected = (cat: Category): boolean => {
    if (cat.id === selectedCategory) return true;
    if (cat.children) {
      return cat.children.some(child => isChildSelected(child));
    }
    return false;
  };

  useEffect(() => {
    if (hasChildren && isChildSelected(category)) {
      setIsOpen(true);
    }
  }, [selectedCategory, category, hasChildren]);

  return (
    <div className="ml-1">
      <div className={`flex items-center py-2 px-2 cursor-pointer rounded-lg transition-colors ${selectedCategory === category.id ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50 text-slate-600 hover:text-slate-800"}`}>
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="mr-1.5 p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        <span
          className={`${selectedCategory === category.id ? "font-semibold" : ""} flex-1 text-sm`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(category.id);
          }}
        >
          {label}
        </span>
      </div>
      {isOpen && hasChildren && (
        <div className="ml-3 border-l-2 border-slate-100 pl-2">
          {category.children!.map(child => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              onSelect={onSelect}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CategoryPickerProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  locale: string;
  t: (key: string) => string;
}

export const CategoryPicker = ({
  categories,
  selectedCategory,
  onSelectCategory,
  locale,
  t,
}: CategoryPickerProps) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 sticky top-24">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg">{t('categories')}</h3>
        <button
          onClick={() => onSelectCategory(null)}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
        >
          {t('clear')}
        </button>
      </div>
      <div className="space-y-1">
        {categories.map(cat => (
          <CategoryItem
            key={cat.id}
            category={cat}
            selectedCategory={selectedCategory}
            onSelect={onSelectCategory}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
};

