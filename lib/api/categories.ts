/**
 * Categories API service - handles category-related API calls
 */

import { apiGet } from "./client";
import type { CategoriesResponse, Category } from "./types";

/**
 * Fetch all categories with their hierarchical structure
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const data = await apiGet<CategoriesResponse>("/api/categories");
    if (data && Array.isArray(data.categories)) {
      return data.categories;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

/**
 * Find a category by ID in the category tree
 */
export function findCategoryById(
  categories: Category[],
  id: string
): Category | null {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children) {
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get all category IDs including children (for filtering)
 */
export function getAllCategoryIds(category: Category): string[] {
  const ids = [category.id];
  if (category.children) {
    category.children.forEach((child) => {
      ids.push(...getAllCategoryIds(child));
    });
  }
  return ids;
}

/**
 * Flatten category tree into a list
 */
export function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = [];
  const flatten = (cats: Category[]) => {
    cats.forEach((cat) => {
      result.push(cat);
      if (cat.children) {
        flatten(cat.children);
      }
    });
  };
  flatten(categories);
  return result;
}



