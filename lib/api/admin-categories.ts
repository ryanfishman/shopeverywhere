/**
 * Admin Categories API Service
 * Handles all API calls for the admin categories management page
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

// Types
export type AdminCategoryNode = {
  id: string;
  parentId: string | null;
  nameTranslations: Record<string, string>;
  children: AdminCategoryNode[];
};

// API Functions

/**
 * Fetch all categories as a tree
 */
export async function fetchAdminCategories(): Promise<{ categories: AdminCategoryNode[] }> {
  return apiGet<{ categories: AdminCategoryNode[] }>('/api/admin/categories');
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  parentId: string | null = null
): Promise<AdminCategoryNode> {
  return apiPost<AdminCategoryNode>('/api/admin/categories', {
    parentId,
    translations: { en: name },
  });
}

/**
 * Update a category's translations
 */
export async function updateCategory(
  id: string,
  translations: Record<string, string>
): Promise<AdminCategoryNode> {
  return apiPut<AdminCategoryNode>(`/api/admin/categories/${id}`, { translations });
}

/**
 * Delete a category
 */
export async function deleteCategoryById(id: string): Promise<void> {
  await apiDelete(`/api/admin/categories/${id}`);
}

// Utility Functions

/**
 * Flatten category tree into a Map for quick lookups
 */
export function flattenCategoryTree(nodes: AdminCategoryNode[]): Map<string, AdminCategoryNode> {
  const map = new Map<string, AdminCategoryNode>();
  const traverse = (list: AdminCategoryNode[]) => {
    list.forEach((node) => {
      map.set(node.id, node);
      if (node.children?.length) traverse(node.children);
    });
  };
  traverse(nodes);
  return map;
}

/**
 * Filter categories by search term
 */
export function filterCategoriesBySearch(
  categories: AdminCategoryNode[],
  search: string,
  locale: string,
  getLocalizedName: (translations: Record<string, string>, locale: string) => string
): AdminCategoryNode[] {
  if (!search) return categories;
  
  const lower = search.toLowerCase();
  
  const filterNode = (node: AdminCategoryNode): AdminCategoryNode | null => {
    const label = getLocalizedName(node.nameTranslations, locale).toLowerCase();
    const childMatches = node.children
      .map(filterNode)
      .filter((child): child is AdminCategoryNode => Boolean(child));
    
    if (label.includes(lower) || childMatches.length) {
      return { ...node, children: childMatches };
    }
    return null;
  };
  
  return categories
    .map(filterNode)
    .filter((node): node is AdminCategoryNode => Boolean(node));
}

