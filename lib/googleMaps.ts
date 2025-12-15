// Shared Google Maps configuration to prevent multiple loader instances with different options

export const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing")[] = ["places", "drawing"];

export const GOOGLE_MAPS_CONFIG = {
  id: "google-maps-script",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  libraries: GOOGLE_MAPS_LIBRARIES,
} as const;




