"use client";

import { ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { AdminCategoryNode } from "./types";

interface CategoryTreeProps {
  categories: AdminCategoryNode[];
  selectedId: string | null;
  expanded: Record<string, boolean>;
  locale: string;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (category: AdminCategoryNode) => void;
}

export function CategoryTree({
  categories,
  selectedId,
  expanded,
  locale,
  onSelect,
  onToggleExpand,
  onAddChild,
  onDelete,
}: CategoryTreeProps) {
  const renderTree = (nodes: AdminCategoryNode[], depth = 0) => (
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
                <button
                  onClick={() => onToggleExpand(node.id)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-8" />
              )}
              <button
                onClick={() => onSelect(node.id)}
                className={`flex-1 text-left py-2 font-medium ${
                  isSelected ? "text-amber-700" : "text-slate-700"
                }`}
                style={{ marginLeft: depth * 4 }}
              >
                {label}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id);
                }}
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title={t(locale, "add")}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node);
                }}
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

  return renderTree(categories);
}

