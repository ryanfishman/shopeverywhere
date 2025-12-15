/**
 * Products API service - handles product-related API calls
 */

import { apiGet } from "./client";
import type { ProductsResponse, Product } from "./types";

interface FetchProductsParams {
  zoneId: string;
  page?: number;
  searchQuery?: string;
  categoryId?: string | null;
  limit?: number;
}

/**
 * Fetch products with filtering and pagination
 */
export async function fetchProducts(
  params: FetchProductsParams
): Promise<ProductsResponse> {
  const { zoneId, page = 1, searchQuery = "", categoryId, limit } = params;

  const queryParams: Record<string, string | number | undefined> = {
    zoneId,
    page,
    q: searchQuery,
  };

  if (categoryId) {
    queryParams.categoryId = categoryId;
  }

  if (limit) {
    queryParams.limit = limit;
  }

  return apiGet<ProductsResponse>("/api/products", queryParams);
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(productId: string): Promise<Product> {
  return apiGet<Product>(`/api/products/${productId}`);
}

/**
 * Extract unique stores from products
 */
export function extractUniqueStores(
  products: Product[]
): { id: string; name: string }[] {
  const storeMap = new Map<string, { id: string; name: string }>();
  
  products.forEach((product) => {
    if (product.storeId && product.ownerStoreName) {
      storeMap.set(product.storeId, {
        id: product.storeId,
        name: product.ownerStoreName,
      });
    }
  });

  return Array.from(storeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Filter products by store IDs
 */
export function filterProductsByStores(
  products: Product[],
  storeIds: Set<string>
): Product[] {
  if (storeIds.size === 0) {
    return products; // No filter applied, show all
  }
  return products.filter(
    (product) => product.storeId && storeIds.has(product.storeId)
  );
}

/**
 * Merge products for pagination (append new products)
 */
export function mergeProducts(
  existingProducts: Product[],
  newProducts: Product[],
  isFirstPage: boolean
): Product[] {
  if (isFirstPage) {
    return newProducts;
  }
  return [...existingProducts, ...newProducts];
}



