/**
 * Location API service - handles location-related API calls
 */

import { apiPost } from "./client";
import type {
  LocationCheckResponse,
  LocationSaveResponse,
  LocationDetails,
  ZoneInfo,
} from "./types";

interface LocationPayload {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
}

/**
 * Check if a location is in a service zone and if it would change zones
 */
export async function checkLocation(
  payload: LocationPayload,
  cartId?: string | null
): Promise<LocationCheckResponse> {
  return apiPost<LocationCheckResponse>("/api/location/check", {
    ...payload,
    cartId,
  });
}

/**
 * Save/persist a location to the backend (updates cart and user profile)
 */
export async function saveLocation(
  payload: LocationPayload,
  cartId?: string | null
): Promise<LocationSaveResponse> {
  return apiPost<LocationSaveResponse>("/api/location", {
    ...payload,
    cartId,
  });
}

/**
 * Parse location from coordinates using browser's geocoder
 * Returns address components from Google Maps API
 */
export function reverseGeocode(
  lat: number,
  lng: number
): Promise<{
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
} | null> {
  return new Promise((resolve) => {
    if (typeof google === "undefined" || !google.maps?.Geocoder) {
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const result = results[0];
        const getComponent = (type: string) =>
          result.address_components?.find((c) => c.types?.includes(type))
            ?.long_name || "";

        resolve({
          address: result.formatted_address?.split(",")[0] || "",
          city:
            getComponent("locality") ||
            getComponent("sublocality") ||
            getComponent("administrative_area_level_2"),
          state: getComponent("administrative_area_level_1"),
          postalCode: getComponent("postal_code"),
          country: getComponent("country"),
        });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Geocode an address string to coordinates
 */
export function geocodeAddress(
  addressString: string
): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof google === "undefined" || !google.maps?.Geocoder) {
      resolve(null);
      return;
    }

    if (!addressString.trim()) {
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: addressString }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Build address string from form fields
 */
export function buildAddressString(form: {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}): string {
  return [form.address, form.city, form.state, form.postalCode, form.country]
    .filter(Boolean)
    .join(", ");
}

/**
 * Get current position from browser geolocation
 */
export function getCurrentPosition(
  options?: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      reject(new Error("Geolocation not available"));
      return;
    }

    window.navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      options || {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Check if geolocation is available (requires secure context)
 */
export function isGeolocationAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const isSecure = window.isSecureContext === true;
  const hasGeolocation = !!window.navigator?.geolocation;
  return isSecure && hasGeolocation;
}

/**
 * Store location data in localStorage
 */
export function saveLocationToStorage(
  location: LocationDetails,
  zone: ZoneInfo | null
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "se_location",
    JSON.stringify({ location, zone })
  );
}

/**
 * Load location data from localStorage
 */
export function loadLocationFromStorage(): {
  location: LocationDetails;
  zone: ZoneInfo | null;
} | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem("se_location");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (parsed?.location) {
      return {
        location: parsed.location,
        zone: parsed.zone || null,
      };
    }
  } catch {
    // Invalid JSON, ignore
  }
  return null;
}

/**
 * Store cart ID in localStorage
 */
export function saveCartIdToStorage(cartId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("se_cart_id", cartId);
}

/**
 * Load cart ID from localStorage
 */
export function loadCartIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("se_cart_id");
}



