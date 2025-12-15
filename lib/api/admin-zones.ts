/**
 * Admin Zones API service - handles zone management API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "./client";

// Types
export type LatLng = { lat: number; lng: number };

export interface ZoneSummary {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  coordinates: LatLng[];
}

export interface StoreInfo {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  inZone: boolean;
}

export interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  openCarts: number;
  completedCarts: number;
}

export interface ZoneDetail {
  zone: ZoneSummary;
  stores: StoreInfo[];
  users: UserInfo[];
}

interface ZonesListResponse {
  zones: ZoneSummary[];
}

// API Functions

/**
 * Fetch all zones
 */
export async function fetchZones(): Promise<ZoneSummary[]> {
  try {
    const data = await apiGet<ZonesListResponse>("/api/admin/zones");
    return data.zones || [];
  } catch (error) {
    console.error("Failed to fetch zones:", error);
    return [];
  }
}

/**
 * Fetch zone details including stores and users
 */
export async function fetchZoneDetail(zoneId: string): Promise<ZoneDetail | null> {
  try {
    return await apiGet<ZoneDetail>(`/api/admin/zones/${zoneId}`);
  } catch (error) {
    console.error("Failed to fetch zone detail:", error);
    return null;
  }
}

/**
 * Create a new zone
 */
export async function createZone(
  name: string,
  translations: Record<string, string> = {}
): Promise<ZoneSummary | null> {
  try {
    const zone = await apiPost<ZoneSummary>("/api/admin/zones", {
      name,
      translations: { en: name, ...translations },
    });
    return { ...zone, coordinates: [] };
  } catch (error) {
    console.error("Failed to create zone:", error);
    return null;
  }
}

/**
 * Update a zone's translations and coordinates
 */
export async function updateZone(
  zoneId: string,
  translations: Record<string, string>,
  coordinates: LatLng[]
): Promise<ZoneSummary | null> {
  try {
    return await apiPut<ZoneSummary>(`/api/admin/zones/${zoneId}`, {
      translations,
      coordinates,
    });
  } catch (error) {
    console.error("Failed to update zone:", error);
    return null;
  }
}

/**
 * Delete a zone
 */
export async function deleteZone(zoneId: string): Promise<boolean> {
  try {
    await apiDelete(`/api/admin/zones/${zoneId}`);
    return true;
  } catch (error) {
    console.error("Failed to delete zone:", error);
    return false;
  }
}

/**
 * Add a store to a zone
 */
export async function addStoreToZone(
  zoneId: string,
  storeId: string
): Promise<boolean> {
  try {
    await apiPost(`/api/admin/zones/${zoneId}/stores`, { storeId });
    return true;
  } catch (error) {
    console.error("Failed to add store to zone:", error);
    return false;
  }
}

/**
 * Remove a store from a zone
 */
export async function removeStoreFromZone(
  zoneId: string,
  storeId: string
): Promise<boolean> {
  try {
    await apiDelete(`/api/admin/zones/${zoneId}/stores`, { storeId });
    return true;
  } catch (error) {
    console.error("Failed to remove store from zone:", error);
    return false;
  }
}

/**
 * Toggle store zone membership
 */
export async function toggleStoreInZone(
  zoneId: string,
  storeId: string,
  currentlyInZone: boolean
): Promise<boolean> {
  if (currentlyInZone) {
    return removeStoreFromZone(zoneId, storeId);
  } else {
    return addStoreToZone(zoneId, storeId);
  }
}

// Utility Functions

/**
 * Calculate bounding box and zoom level for polygon coordinates
 */
export function getBoundingBox(coords: LatLng[]): { center: LatLng; zoom: number } {
  const DEFAULT_CENTER = { lat: 45.5017, lng: -73.5673 };

  if (!coords || coords.length === 0) {
    return { center: DEFAULT_CENTER, zoom: 10 };
  }

  let minLat = coords[0].lat;
  let maxLat = coords[0].lat;
  let minLng = coords[0].lng;
  let maxLng = coords[0].lng;

  coords.forEach((coord) => {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  });

  const center = {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };

  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  let zoom = 12;
  if (maxDiff > 0.5) zoom = 9;
  else if (maxDiff > 0.2) zoom = 10;
  else if (maxDiff > 0.1) zoom = 11;
  else if (maxDiff > 0.05) zoom = 12;
  else if (maxDiff > 0.01) zoom = 13;
  else zoom = 14;

  return { center, zoom };
}

/**
 * Filter zones by search query
 */
export function filterZonesBySearch(
  zones: ZoneSummary[],
  search: string,
  locale: string,
  getLocalizedName: (translations: Record<string, string>, locale: string, fallback: string) => string
): ZoneSummary[] {
  if (!search) return zones;
  const lower = search.toLowerCase();
  return zones.filter((zone) => {
    const name = getLocalizedName(zone.nameTranslations, locale, zone.name);
    return name.toLowerCase().includes(lower);
  });
}

/**
 * Filter stores by search query
 */
export function filterStoresBySearch(
  stores: StoreInfo[],
  search: string,
  locale: string,
  getLocalizedName: (translations: Record<string, string>, locale: string, fallback: string) => string
): StoreInfo[] {
  if (!search) return stores;
  const lower = search.toLowerCase();
  return stores.filter((store) => {
    const name = getLocalizedName(store.nameTranslations, locale, store.name);
    return name.toLowerCase().includes(lower) || store.address?.toLowerCase().includes(lower);
  });
}

/**
 * Get polygon colors for zones
 */
export const POLYGON_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
];

export const DEFAULT_MAP_CENTER = { lat: 45.5017, lng: -73.5673 };
export const MAP_CONTAINER_STYLE = { width: "100%", height: "480px" };



