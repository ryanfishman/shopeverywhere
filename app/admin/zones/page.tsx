"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";
import { LANGUAGES } from "@/lib/i18n";
import { t } from "@/translations/translations";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";
import { Save, Loader2 } from "lucide-react";

// Import API functions and types
import {
  fetchZones,
  fetchZoneDetail,
  createZone,
  updateZone,
  deleteZone,
  toggleStoreInZone,
  getBoundingBox,
  filterZonesBySearch,
  filterStoresBySearch,
  DEFAULT_MAP_CENTER,
} from "@/lib/api";
import type { ZoneSummary, ZoneDetail, StoreInfo, LatLng } from "@/lib/api";

// Import components
import {
  ZoneSidebar,
  ZoneMap,
  ZoneTranslationInputs,
  StoresTable,
  UsersTable,
  AddZoneModal,
  DeleteZoneModal,
} from "@/components/admin/zones";
import { getLocalizedName } from "@/lib/i18n";

const blankTranslations = () =>
  LANGUAGES.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = "";
    return acc;
  }, {});

const ZonesAdminPage = () => {
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [search, setSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const { locale } = usePreferredLocale();
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(10);
  const [editedPath, setEditedPath] = useState<LatLng[]>([]);
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>(blankTranslations());
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ZoneSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");

  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // Fetch zones on mount
  useEffect(() => {
    const loadZones = async () => {
      const data = await fetchZones();
      setZones(data);
      if (!selectedZoneId && data[0]) {
        setSelectedZoneId(data[0].id);
      }
    };
    loadZones();
  }, []);

  // Fetch zone detail when selection changes
  useEffect(() => {
    const loadZoneDetail = async () => {
      if (!selectedZoneId) return;
      setLoadingDetail(true);
      setSelectedStoreId(null);

      const data = await fetchZoneDetail(selectedZoneId);
      if (data) {
        setZoneDetail(data);
          const coords = Array.isArray(data.zone.coordinates) ? data.zone.coordinates : [];
          setEditedPath(coords);
          setEditedTranslations({
            ...blankTranslations(),
            ...(data.zone.nameTranslations || {}),
          });
          
          const { center, zoom } = getBoundingBox(coords);
          setMapCenter(center);
          setMapZoom(zoom);
          
          if (mapRef.current && coords.length > 0) {
            mapRef.current.panTo(center);
            mapRef.current.setZoom(zoom);
          }
        } else {
          setZoneDetail(null);
        }

      setLoadingDetail(false);
    };
    loadZoneDetail();
  }, [selectedZoneId]);

  // Filter zones by search
  const filteredZones = useMemo(
    () => filterZonesBySearch(zones, search, locale, getLocalizedName),
    [zones, search, locale]
  );

  // Filter stores by search
  const filteredStores = useMemo(
    () => zoneDetail ? filterStoresBySearch(zoneDetail.stores, storeSearch, locale, getLocalizedName) : [],
    [zoneDetail, storeSearch, locale]
  );

  // Handle add zone
  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    const zone = await createZone(newZoneName);
    if (zone) {
      setZones((prev) => [...prev, zone]);
      setSelectedZoneId(zone.id);
    }
    setNewZoneName("");
    setShowAddModal(false);
  };

  // Handle delete zone
  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;
    const success = await deleteZone(zoneToDelete.id);
    if (success) {
      setZones((prev) => prev.filter((z) => z.id !== zoneToDelete.id));
      if (selectedZoneId === zoneToDelete.id) {
        setZoneDetail(null);
        setSelectedZoneId((prev) => {
          const remaining = zones.filter((z) => z.id !== prev);
          return remaining[0]?.id || null;
        });
      }
    }
    setZoneToDelete(null);
  };

  // Handle save zone
  const handleSaveZone = async () => {
    if (!selectedZoneId || !zoneDetail) return;
    setSaving(true);
    const updatedZone = await updateZone(selectedZoneId, editedTranslations, editedPath);
    if (updatedZone) {
      setZones((prev) =>
        prev.map((zone) =>
          zone.id === selectedZoneId
            ? { ...zone, name: updatedZone.name, nameTranslations: updatedZone.nameTranslations, coordinates: editedPath }
            : zone
        )
      );
      setZoneDetail((prev) =>
        prev
          ? {
              ...prev,
              zone: {
                ...prev.zone,
                name: updatedZone.name,
                nameTranslations: updatedZone.nameTranslations,
              },
            }
          : prev
      );
    }
    setSaving(false);
  };

  // Handle toggle store
  const handleToggleStore = async (store: StoreInfo) => {
    if (!selectedZoneId) return;
    const success = await toggleStoreInZone(selectedZoneId, store.id, store.inZone);
    if (success) {
    setZoneDetail((prev) =>
      prev
        ? {
            ...prev,
            stores: prev.stores.map((s) => (s.id === store.id ? { ...s, inZone: !s.inZone } : s)),
          }
        : prev
    );
    setSelectedStoreId(null);
    }
  };

  // Handle select zone from sidebar
  const handleSelectZone = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId);
    setMobileSidebarOpen(false);
  }, []);

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <div className="relative flex gap-6 h-full">
      {/* Sidebar */}
      <ZoneSidebar
        zones={filteredZones}
        selectedZoneId={selectedZoneId}
        search={search}
        onSearchChange={setSearch}
        onSelectZone={handleSelectZone}
        onAddZone={() => setShowAddModal(true)}
        onDeleteZone={setZoneToDelete}
        locale={locale}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {loadingDetail ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            {t(locale, "loadingZone")}
          </div>
        ) : !zoneDetail ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {selectedZoneId ? t(locale, "failedToLoadZone") : t(locale, "selectZone")}
          </div>
        ) : (
          <>
            {/* Zone editor */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[300px]">
                  <ZoneTranslationInputs
                    translations={editedTranslations}
                    onTranslationChange={setEditedTranslations}
                    locale={locale}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveZone}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:from-slate-700 hover:to-slate-600 shadow-lg disabled:opacity-70 transition-all"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t(locale, "saveChanges")}
                  </button>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden border border-slate-200/60 shadow-inner">
                <ZoneMap
                  isLoaded={isLoaded}
                  zones={zones}
                  selectedZoneId={selectedZoneId}
                  editedPath={editedPath}
                  stores={zoneDetail.stores}
                  selectedStoreId={selectedStoreId}
                  mapCenter={mapCenter}
                  mapZoom={mapZoom}
                  onSelectZone={setSelectedZoneId}
                  onEditPath={setEditedPath}
                  onSelectStore={setSelectedStoreId}
                  onToggleStore={handleToggleStore}
                  onMapLoad={handleMapLoad}
                  locale={locale}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  {t(locale, "storeInZone")}
                </span>
                <span className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  {t(locale, "storeOutsideZone")}
                </span>
                <span className="text-slate-400">• {t(locale, "clickMarkersHint")}</span>
                <span className="text-slate-400">• {t(locale, "dragPolygonHint")}</span>
              </div>
            </div>

            {/* Stores and Users tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StoresTable
                stores={filteredStores}
                search={storeSearch}
                onSearchChange={setStoreSearch}
                onToggleStore={handleToggleStore}
                locale={locale}
              />

              <UsersTable
                users={zoneDetail.users}
                locale={locale}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddZoneModal
        isOpen={showAddModal}
        zoneName={newZoneName}
        onZoneNameChange={setNewZoneName}
        onAdd={handleAddZone}
        onClose={() => {
          setShowAddModal(false);
          setNewZoneName("");
        }}
        locale={locale}
      />

      <DeleteZoneModal
        zone={zoneToDelete}
        onDelete={handleDeleteZone}
        onClose={() => setZoneToDelete(null)}
        locale={locale}
      />
    </div>
  );
};

export default ZonesAdminPage;
