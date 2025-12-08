type AddressComponents = Array<{ long_name?: string; short_name?: string; types?: string[] }>;

const getGoogleApiKey = () => process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const extractComponent = (components: AddressComponents, type: string) => {
  const match = components?.find((component: any) => component.types?.includes(type));
  return match ? match.long_name : undefined;
};

const toNormalizedAddress = (result: any) => {
  const components = result.address_components || [];
  const streetNumber = extractComponent(components, "street_number");
  const route = extractComponent(components, "route");

  return {
    address: [streetNumber, route].filter(Boolean).join(" ") || result.formatted_address,
    city: extractComponent(components, "locality") || extractComponent(components, "administrative_area_level_2"),
    state: extractComponent(components, "administrative_area_level_1"),
    country: extractComponent(components, "country"),
    postalCode: extractComponent(components, "postal_code"),
    latitude: result.geometry?.location?.lat,
    longitude: result.geometry?.location?.lng,
  };
};

export type NormalizedAddress = {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
};

export const geocodeAddress = async (addressParts: {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}) => {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return null;

  const line = [addressParts.address, addressParts.city, addressParts.state, addressParts.postalCode, addressParts.country]
    .filter(Boolean)
    .join(", ");

  if (!line) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(line)}&key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "OK" || !data.results?.length) return null;

  return toNormalizedAddress(data.results[0]);
};

export const reverseGeocode = async (lat: number, lng: number) => {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "OK" || !data.results?.length) return null;

  return toNormalizedAddress(data.results[0]);
};

