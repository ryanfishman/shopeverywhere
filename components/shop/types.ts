// --- Types ---
export interface Category {
  id: string;
  nameTranslations: Record<string, string>;
  children?: Category[];
}

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

export interface LocationDetails {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type LocationPayload = {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
};

export interface ZoneInfo {
  inZone: boolean;
  zoneId?: string;
  zoneName?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Store {
  id: string;
  name: string;
}

