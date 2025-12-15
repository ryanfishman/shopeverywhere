/**
 * Admin Stores API Service
 * Handles all API calls for the admin stores management page
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

// Types
export type StoreRecord = {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  shortDescriptionTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  imageUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
};

export type CategoryNode = {
  id: string;
  nameTranslations: Record<string, string>;
  children?: CategoryNode[];
};

export type ProductRecord = {
  id: string;
  categoryId: string;
  storeId: string;
  nameTranslations: Record<string, string>;
  shortDescriptionTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  imageUrl: string | null;
  price: number;
};

export type StoreFormData = {
  translations: Record<string, string>;
  shortDescription: Record<string, string>;
  longDescription: Record<string, string>;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  imageUrl: string;
};

export type ProductEditorState = {
  mode: "create" | "edit";
  categoryId: string;
  productId?: string;
  translations: Record<string, string>;
  shortDescription: Record<string, string>;
  longDescription: Record<string, string>;
  imageUrl: string;
  file: File | null;
  price: string;
};

// API Functions

/**
 * Fetch all stores with optional search query
 */
export async function fetchStores(search?: string): Promise<{ stores: StoreRecord[] }> {
  const url = search 
    ? `/api/admin/stores?search=${encodeURIComponent(search)}`
    : '/api/admin/stores';
  return apiGet<{ stores: StoreRecord[] }>(url);
}

/**
 * Fetch a single store with its products
 */
export async function fetchStoreDetail(id: string): Promise<{ store: StoreRecord; products: ProductRecord[] }> {
  return apiGet<{ store: StoreRecord; products: ProductRecord[] }>(`/api/admin/stores/${id}`);
}

/**
 * Fetch all categories
 */
export async function fetchStoreCategories(): Promise<{ categories: CategoryNode[] }> {
  return apiGet<{ categories: CategoryNode[] }>('/api/admin/categories');
}

/**
 * Create a new store
 */
export async function createStore(data: {
  translations: Record<string, string>;
  latitude?: number;
  longitude?: number;
}): Promise<StoreRecord> {
  return apiPost<StoreRecord>('/api/admin/stores', data);
}

/**
 * Update a store (uses FormData for image upload)
 */
export async function updateStore(id: string, formData: FormData): Promise<StoreRecord> {
  const res = await fetch(`/api/admin/stores/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Failed to update store');
  }
  return res.json();
}

/**
 * Delete a store
 */
export async function deleteStore(id: string): Promise<void> {
  await apiDelete(`/api/admin/stores/${id}`);
}

/**
 * Create a new product
 */
export async function createProduct(formData: FormData): Promise<ProductRecord> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Failed to create product');
  }
  return res.json();
}

/**
 * Update a product
 */
export async function updateProduct(id: string, formData: FormData): Promise<ProductRecord> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Failed to update product');
  }
  return res.json();
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiDelete(`/api/admin/products/${id}`);
}

// Utility Functions

/**
 * Flatten category tree to get only leaf categories
 */
export function flattenCategoryLeaves(nodes: CategoryNode[]): CategoryNode[] {
  const leaves: CategoryNode[] = [];
  const traverse = (list: CategoryNode[]) => {
    list.forEach((node) => {
      if (!node.children || node.children.length === 0) {
        leaves.push(node);
      } else {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return leaves;
}

/**
 * Build FormData for store update
 */
export function buildStoreFormData(
  form: StoreFormData,
  imageFile: File | null,
  removeImage: boolean
): FormData {
  const formData = new FormData();
  formData.append("translations", JSON.stringify(form.translations));
  formData.append("shortDescription", JSON.stringify(form.shortDescription));
  formData.append("longDescription", JSON.stringify(form.longDescription));
  formData.append("address", form.address);
  formData.append("city", form.city);
  formData.append("state", form.state);
  formData.append("country", form.country);
  formData.append("postalCode", form.postalCode);
  formData.append("latitude", String(Number(form.latitude) || 0));
  formData.append("longitude", String(Number(form.longitude) || 0));

  if (removeImage) {
    formData.append("removeImage", "true");
  } else if (imageFile) {
    formData.append("image", imageFile);
  } else if (form.imageUrl) {
    formData.append("imageUrl", form.imageUrl);
  }

  return formData;
}

/**
 * Build FormData for product create/update
 */
export function buildProductFormData(
  editor: ProductEditorState,
  storeId: string
): FormData {
  const fd = new FormData();
  fd.append("categoryId", editor.categoryId);
  fd.append("nameTranslations", JSON.stringify(editor.translations));
  fd.append("shortDescription", JSON.stringify(editor.shortDescription));
  fd.append("longDescription", JSON.stringify(editor.longDescription));
  fd.append("imageUrl", editor.imageUrl);
  fd.append("price", editor.price || "0");
  fd.append("storeId", storeId);
  if (editor.file) {
    fd.append("file", editor.file);
  }
  return fd;
}

/**
 * Hydrate store form from store record
 */
export function hydrateStoreForm(
  store: StoreRecord,
  blankTranslations: () => Record<string, string>
): StoreFormData {
  return {
    translations: { ...blankTranslations(), ...store.nameTranslations },
    shortDescription: { ...blankTranslations(), ...store.shortDescriptionTranslations },
    longDescription: { ...blankTranslations(), ...store.descriptionTranslations },
    address: store.address || "",
    city: store.city || "",
    state: store.state || "",
    country: store.country || "",
    postalCode: store.postalCode || "",
    latitude: store.latitude !== undefined && store.latitude !== null ? String(store.latitude) : "",
    longitude: store.longitude !== undefined && store.longitude !== null ? String(store.longitude) : "",
    imageUrl: store.imageUrl || "",
  };
}



