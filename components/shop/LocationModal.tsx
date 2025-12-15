"use client";

import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";
import { Modal } from "./Modal";

interface AddressForm {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  addressForm: AddressForm;
  onAddressChange: (form: AddressForm) => void;
  mapCenter: { lat: number; lng: number };
  mapMarker: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  onUseCurrentLocation: () => void;
  geolocationAvailable: boolean;
  resolvingLocation: boolean;
  t: (key: string) => string;
}

export const LocationModal = ({
  isOpen,
  onClose,
  onSubmit,
  addressForm,
  onAddressChange,
  mapCenter,
  mapMarker,
  onMapClick,
  onUseCurrentLocation,
  geolocationAvailable,
  resolvingLocation,
  t,
}: LocationModalProps) => {
  const { isLoaded: mapsLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  if (!isOpen) return null;

  return (
    <Modal title={t('selectLocationTitle')} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3">
          <input
            type="text"
            placeholder={t('enterAddressPlaceholder')}
            className="w-full rounded-md border px-4 py-2"
            value={addressForm.address}
            onChange={(e) => onAddressChange({ ...addressForm, address: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t('city') || "City"}
              className="rounded-md border px-4 py-2"
              value={addressForm.city}
              onChange={(e) => onAddressChange({ ...addressForm, city: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder={t('state') || "State / Province"}
              className="rounded-md border px-4 py-2"
              value={addressForm.state}
              onChange={(e) => onAddressChange({ ...addressForm, state: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t('postalCode') || "Postal Code"}
              className="rounded-md border px-4 py-2"
              value={addressForm.postalCode}
              onChange={(e) => onAddressChange({ ...addressForm, postalCode: e.target.value })}
            />
            <input
              type="text"
              placeholder={t('country') || "Country"}
              className="rounded-md border px-4 py-2"
              value={addressForm.country}
              onChange={(e) => onAddressChange({ ...addressForm, country: e.target.value })}
              required
            />
          </div>
        </div>
        {/* Google Map */}
        <div className="h-48 rounded-md overflow-hidden border">
          {mapsLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapMarker || mapCenter}
              zoom={mapMarker ? 15 : 10}
              onClick={(e) => {
                if (e.latLng) {
                  onMapClick(e.latLng.lat(), e.latLng.lng());
                }
              }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {mapMarker && <Marker position={mapMarker} />}
            </GoogleMap>
          ) : (
            <div className="h-full bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500 text-sm">{t('loading')}</p>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500">{t('setLocationMessage')}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {geolocationAvailable && (
            <button
              type="button"
              onClick={onUseCurrentLocation}
              className="rounded-md border border-indigo-200 px-4 py-2 text-indigo-600 hover:bg-indigo-50"
            >
              {t('useCurrentLocation')}
            </button>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:underline"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={resolvingLocation}
              className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {resolvingLocation ? t('loading') : t('save')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};



