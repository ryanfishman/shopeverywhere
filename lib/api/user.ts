/**
 * User API service - handles user profile API calls
 */

import { apiGet } from "./client";
import type { ProfileResponse, LocationDetails, ZoneInfo } from "./types";

/**
 * Fetch current user's profile data
 */
export async function fetchUserProfile(): Promise<ProfileResponse | null> {
  try {
    return await apiGet<ProfileResponse>("/api/user/profile");
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

/**
 * Extract location from user profile
 */
export function extractProfileLocation(
  profile: ProfileResponse
): LocationDetails | null {
  const user = profile.user;
  if (!user) return null;

  const location: LocationDetails = {
    address: user.address,
    city: user.city,
    state: user.state,
    country: user.country,
    postalCode: user.postalCode,
    latitude: user.latitude,
    longitude: user.longitude,
  };

  // Check if location data is valid
  const hasLocation =
    location.address && location.latitude && location.longitude;

  return hasLocation ? location : null;
}

/**
 * Check if profile has complete location data
 */
export function hasCompleteLocation(profile: ProfileResponse): boolean {
  const user = profile.user;
  return !!(user?.address && user?.latitude && user?.longitude);
}

/**
 * Get zone info from profile
 */
export function getProfileZone(profile: ProfileResponse): ZoneInfo | null {
  return profile.zone || null;
}



