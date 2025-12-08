/**
 * API service layer - centralized exports
 */

// Re-export types
export type {
  Product,
  Category,
  LocationDetails,
  ZoneInfo,
  CartItem,
  CartResponse,
  UserProfile,
  ProfileResponse,
  LocationCheckResponse,
  LocationSaveResponse,
  ProductsResponse,
  CategoriesResponse,
} from "./types";

// Re-export client utilities
export { ApiError, apiFetch, apiGet, apiPost, apiPut, apiDelete } from "./client";

// Cart API
export {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  parseCartLocation,
  parseCartItems,
  calculateCartTotals,
  updateCartItemsAfterAdd,
  updateCartItemQuantity,
  removeCartItem,
} from "./cart";

// Categories API
export {
  fetchCategories,
  findCategoryById,
  getAllCategoryIds,
  flattenCategories,
} from "./categories";

// Products API
export {
  fetchProducts,
  fetchProductById,
  extractUniqueStores,
  filterProductsByStores,
  mergeProducts,
} from "./products";

// Location API
export {
  checkLocation,
  saveLocation,
  reverseGeocode,
  geocodeAddress,
  buildAddressString,
  getCurrentPosition,
  isGeolocationAvailable,
  saveLocationToStorage,
  loadLocationFromStorage,
  saveCartIdToStorage,
  loadCartIdFromStorage,
} from "./location";

// User API
export {
  fetchUserProfile,
  extractProfileLocation,
  hasCompleteLocation,
  getProfileZone,
} from "./user";

// Admin Zones API
export {
  fetchZones,
  fetchZoneDetail,
  createZone,
  updateZone,
  deleteZone,
  addStoreToZone,
  removeStoreFromZone,
  toggleStoreInZone,
  getBoundingBox,
  filterZonesBySearch,
  filterStoresBySearch,
  POLYGON_COLORS,
  DEFAULT_MAP_CENTER,
  MAP_CONTAINER_STYLE,
} from "./admin-zones";
export type {
  LatLng,
  ZoneSummary,
  StoreInfo,
  UserInfo,
  ZoneDetail,
} from "./admin-zones";

// Admin Stores API
export {
  fetchStores,
  fetchStoreDetail,
  fetchStoreCategories,
  createStore,
  updateStore,
  deleteStore,
  createProduct,
  updateProduct,
  deleteProduct,
  flattenCategoryLeaves,
  buildStoreFormData,
  buildProductFormData,
  hydrateStoreForm,
} from "./admin-stores";
export type {
  StoreRecord,
  CategoryNode,
  ProductRecord,
  StoreFormData,
  ProductEditorState,
} from "./admin-stores";

// Admin Categories API
export {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategoryById,
  flattenCategoryTree,
  filterCategoriesBySearch,
} from "./admin-categories";
export type { AdminCategoryNode } from "./admin-categories";
