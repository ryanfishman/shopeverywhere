/**
 * Type definitions for the Maxi.ca scraper
 */

export interface ScrapedCategory {
  name: string;
  nameTranslations: {
    en: string;
    fr: string;
  };
  children: ScrapedCategory[];
  url?: string;
}

export interface ScrapedProduct {
  name: string;
  nameTranslations: {
    en: string;
    fr: string;
  };
  shortDescription: string;
  shortDescriptionTranslations: {
    en: string;
    fr: string;
  };
  description: string;
  descriptionTranslations: {
    en: string;
    fr: string;
  };
  imageUrl: string;
  price: number;
  categoryName: string;
  storeId: string;
  brand?: string;
  url?: string;
  productCode?: string;
}

export interface ScrapedData {
  categories: ScrapedCategory[];
  products: ScrapedProduct[];
  scrapedAt: string;
  totalProducts: number;
  totalCategories: number;
  storeName: string;
}

export interface ProductDetails {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
}

export interface ProductListItem {
  name: string;
  url: string;
}

export interface SubcategoryItem {
  name: string;
  url: string;
}

export interface ProductDataItem {
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  brand?: string;
  unit?: string;
  outOfStock: boolean;
}



