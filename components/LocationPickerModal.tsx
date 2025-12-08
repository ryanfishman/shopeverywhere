"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MapPin, Loader2, Navigation, Search } from "lucide-react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";

export interface LocationData {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: LocationData) => void;
  initialLocation?: Partial<LocationData>;
  title?: string;
}

export function LocationPickerModal({
  isOpen,
  onClose,
  onSave,
  initialLocation,
  title = "Select Location",
}: LocationPickerModalProps) {
  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 45.5017, lng: -73.5673 });
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // Initialize from props
  useEffect(() => {
    if (isOpen && initialLocation) {
      setAddressForm({
        address: initialLocation.address || "",
        city: initialLocation.city || "",
        state: initialLocation.state || "",
        postalCode: initialLocation.postalCode || "",
        country: initialLocation.country || "",
      });
      if (initialLocation.latitude && initialLocation.longitude) {
        const pos = { lat: initialLocation.latitude, lng: initialLocation.longitude };
        setMapCenter(pos);
        setMapMarker(pos);
      }
    }
  }, [isOpen, initialLocation]);

  // Geocode address to coordinates
  const geocodeAddress = useCallback(() => {
    if (!addressForm.address && !addressForm.city && !addressForm.country) return;
    if (typeof google === "undefined") return;

    const geocoder = new google.maps.Geocoder();
    const addressString = [addressForm.address, addressForm.city, addressForm.state, addressForm.postalCode, addressForm.country]
      .filter(Boolean)
      .join(", ");

    geocoder.geocode({ address: addressString }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        const pos = { lat: location.lat(), lng: location.lng() };
        setMapCenter(pos);
        setMapMarker(pos);
      }
    });
  }, [addressForm]);

  // Debounce geocoding
  useEffect(() => {
    if (!isOpen || !isLoaded) return;
    const timer = setTimeout(geocodeAddress, 500);
    return () => clearTimeout(timer);
  }, [addressForm, isOpen, isLoaded, geocodeAddress]);

  // Reverse geocode from coordinates
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (typeof google === "undefined") return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const components = results[0].address_components;
        const getComponent = (type: string) =>
          components.find((c) => c.types.includes(type))?.long_name || "";

        setAddressForm({
          address: `${getComponent("street_number")} ${getComponent("route")}`.trim(),
          city: getComponent("locality") || getComponent("sublocality") || getComponent("administrative_area_level_2"),
          state: getComponent("administrative_area_level_1"),
          postalCode: getComponent("postal_code"),
          country: getComponent("country"),
        });
      }
    });
  }, []);

  // Handle map click
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMapMarker({ lat, lng });
      setMapCenter({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  // Use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapMarker({ lat: latitude, lng: longitude });
        setMapCenter({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        setIsGeolocating(false);
      },
      () => {
        setIsGeolocating(false);
      }
    );
  };

  // Handle save
  const handleSave = () => {
    if (!mapMarker) return;

    setIsSaving(true);
    onSave({
      ...addressForm,
      latitude: mapMarker.lat,
      longitude: mapMarker.lng,
    });
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-slate-400 text-sm">Click on the map or enter an address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Address Fields */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500" />
                Address Details
              </h4>
              <button
                onClick={handleUseCurrentLocation}
                disabled={isGeolocating}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {isGeolocating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Navigation className="h-3 w-3" />
                )}
                Use Current Location
              </button>
            </div>

            <div className="space-y-4">
              {/* Street Address */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                  placeholder="123 Main Street"
                />
              </div>

              {/* City & Postal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Montreal"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Postal Code</label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="H2X 1Y4"
                  />
                </div>
              </div>

              {/* State & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Province / State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Quebec"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Canada"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-64 relative">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapMarker || mapCenter}
                  zoom={mapMarker ? 15 : 10}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {mapMarker && <Marker position={mapMarker} />}
                </GoogleMap>
              ) : (
                <div className="h-full bg-slate-100 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                </div>
              )}
            </div>
            {mapMarker && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-mono">
                  GPS: {mapMarker.lat.toFixed(6)}, {mapMarker.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {mapMarker ? "Location selected on map" : "Click on the map to set location"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!mapMarker || isSaving}
              className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all inline-flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Select Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

