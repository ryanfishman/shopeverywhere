/**
 * Shared API response types
 */

// Product types
export interface Product {
  id: string;
  name: string;
  nameTranslations?: Record<string, string>;
  description: string;
  shortDescriptionTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
  imageUrl: string;
  minPrice: number;
  ownerStoreName: string;
  storeId?: string;
  categoryTranslations?: Record<string, string>;
}

// Category types
export interface Category {
  id: string;
  nameTranslations: Record<string, string>;
  children?: Category[];
}

// Location types
export interface LocationDetails {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ZoneInfo {
  inZone: boolean;
  zoneId?: string;
  zoneName?: string;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartResponse {
  cartId: string;
  items: CartItem[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  zoneId?: string;
}

// User types
export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProfileResponse {
  user: UserProfile;
  cartId?: string;
  zone?: ZoneInfo;
}

// Location API types
export interface LocationCheckResponse {
  inZone: boolean;
  zoneChanged: boolean;
  currentZoneId?: string;
  newZone: ZoneInfo;
  location: LocationDetails;
  error?: string;
}

export interface LocationSaveResponse {
  cartId: string;
  location: LocationDetails;
  zone: ZoneInfo | null;
  removedItems?: number;
  error?: string;
}

// Products API types
export interface ProductsResponse {
  products: Product[];
  totalPages: number;
  page: number;
}

// Categories API types
export interface CategoriesResponse {
  categories: Category[];
}

