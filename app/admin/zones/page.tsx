"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useJsApiLoader, GoogleMap, Polygon, Marker, InfoWindow } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";
import { LANGUAGES, getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import { usePreferredLocale } from "@/hooks/usePreferredLocale";
import {
  Plus,
  Trash2,
  Save,
  MapPin,
  Search,
  Loader2,
  Store,
} from "lucide-react";

type LatLng = { lat: number; lng: number };

type ZoneSummary = {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  coordinates: LatLng[];
};

type StoreInfo = {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  inZone: boolean;
};

type UserInfo = {
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
};

type ZoneDetail = {
  zone: ZoneSummary;
  stores: StoreInfo[];
  users: UserInfo[];
};

const MAP_CONTAINER_STYLE = { width: "100%", height: "480px" };
const DEFAULT_CENTER = { lat: 45.5017, lng: -73.5673 };

const blankTranslations = () =>
  LANGUAGES.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = "";
    return acc;
  }, {});

const getBoundingBox = (coords: LatLng[]): { center: LatLng; zoom: number } => {
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
};

const ZonesAdminPage = () => {
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [search, setSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const { locale } = usePreferredLocale();
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(10);
  const [editedPath, setEditedPath] = useState<LatLng[]>([]);
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>(blankTranslations());
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [vertexMenu, setVertexMenu] = useState<{ index: number; x: number; y: number } | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<ZoneSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  
  // Manual polygon drag state
  const isDraggingPolygon = useRef(false);
  const dragStartLatLng = useRef<google.maps.LatLng | null>(null);
  const dragStartPath = useRef<LatLng[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // Handle global mouseup for drag end
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingPolygon.current) {
        endPolygonDrag();
      }
    };
    
    window.addEventListener("mouseup", handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  // Click-away handler for vertex menu
  useEffect(() => {
    if (!vertexMenu) return;
    
    const handleClickAway = (e: MouseEvent) => {
      // Check if the click is outside the vertex menu
      const target = e.target as HTMLElement;
      if (!target.closest('[data-vertex-menu]')) {
        setVertexMenu(null);
      }
    };
    
    // Use setTimeout to avoid closing immediately on the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickAway);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickAway);
    };
  }, [vertexMenu]);

  useEffect(() => {
    const fetchZones = async () => {
      const res = await fetch("/api/admin/zones");
      const data = await res.json();
      setZones(data.zones || []);
      if (!selectedZoneId && data.zones?.[0]) {
        setSelectedZoneId(data.zones[0].id);
      }
    };
    fetchZones();
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedZoneId) return;
      setLoadingDetail(true);
      setSelectedStoreId(null);
      try {
      const res = await fetch(`/api/admin/zones/${selectedZoneId}`);
      if (res.ok) {
        const data = await res.json();
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
      } catch (err) {
        console.error("Failed to fetch zone detail:", err);
        setZoneDetail(null);
      }
      setLoadingDetail(false);
    };
    fetchDetail();
  }, [selectedZoneId]);

  const polygonColors = useMemo(
    () => [
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
    ],
    []
  );

  const filteredZones = useMemo(() => {
    if (!search) return zones;
    const lower = search.toLowerCase();
    return zones.filter((zone) => {
      const name = getLocalizedName(zone.nameTranslations, locale, zone.name);
      return name.toLowerCase().includes(lower);
    });
  }, [zones, search, locale]);

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return;
    const res = await fetch("/api/admin/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newZoneName, translations: { en: newZoneName } }),
    });
    if (res.ok) {
      const zone = await res.json();
      setZones((prev) => [...prev, { ...zone, coordinates: [] }]);
      setSelectedZoneId(zone.id);
    }
    setNewZoneName("");
    setShowAddModal(false);
  };

  const handleDeleteZone = async (zone: ZoneSummary) => {
    const res = await fetch(`/api/admin/zones/${zone.id}`, { method: "DELETE" });
    if (res.ok) {
      setZones((prev) => prev.filter((z) => z.id !== zone.id));
      if (selectedZoneId === zone.id) {
        setZoneDetail(null);
        setSelectedZoneId((prev) => {
          const remaining = zones.filter((z) => z.id !== prev);
          return remaining[0]?.id || null;
        });
      }
    }
    setZoneToDelete(null);
  };

  const onEdit = useCallback(() => {
    if (polygonRef.current) {
      const path = polygonRef.current.getPath();
      const updated = path.getArray().map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));
      setEditedPath(updated);
    }
  }, []);

  const onPolygonLoad = useCallback((polygon: google.maps.Polygon) => {
    polygonRef.current = polygon;
    
    // Listen for vertex changes on the polygon path
    const path = polygon.getPath();
    
    // When a vertex is moved
    google.maps.event.addListener(path, "set_at", () => {
      onEdit();
    });
    
    // When a new vertex is inserted (from midpoint)
    google.maps.event.addListener(path, "insert_at", () => {
      onEdit();
    });
    
    // When a vertex is removed
    google.maps.event.addListener(path, "remove_at", () => {
      onEdit();
    });
  }, [onEdit]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleDeleteVertex = () => {
    if (!polygonRef.current || !vertexMenu) return;
    const path = polygonRef.current.getPath();
    const index = vertexMenu.index;
    if (index < 0 || path.getLength() <= 3) {
      setVertexMenu(null);
      return;
    }
    path.removeAt(index);
    onEdit();
    setVertexMenu(null);
  };

  const startPolygonDrag = (latLng: google.maps.LatLng) => {
    isDraggingPolygon.current = true;
    dragStartLatLng.current = latLng;
    dragStartPath.current = [...editedPath];
    mapRef.current?.setOptions({ draggable: false, draggableCursor: "move" });
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = "move";
    }
  };

  const endPolygonDrag = () => {
    isDraggingPolygon.current = false;
    dragStartLatLng.current = null;
    dragStartPath.current = [];
    mapRef.current?.setOptions({ draggable: true, draggableCursor: null });
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = "";
    }
  };

  const handlePolygonDrag = useCallback((latLng: google.maps.LatLng) => {
    if (!isDraggingPolygon.current || !dragStartLatLng.current || dragStartPath.current.length === 0) return;
    
    const deltaLat = latLng.lat() - dragStartLatLng.current.lat();
    const deltaLng = latLng.lng() - dragStartLatLng.current.lng();
    
    const newPath = dragStartPath.current.map((coord) => ({
      lat: coord.lat + deltaLat,
      lng: coord.lng + deltaLng,
    }));
    
    setEditedPath(newPath);
  }, []);

  const handleSaveZone = async () => {
    if (!selectedZoneId || !zoneDetail) return;
    setSaving(true);
    const res = await fetch(`/api/admin/zones/${selectedZoneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        translations: editedTranslations,
        coordinates: editedPath,
      }),
    });
    if (res.ok) {
      const updatedZone = await res.json();
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

  const toggleStore = async (store: StoreInfo) => {
    if (!selectedZoneId) return;
    const method = store.inZone ? "DELETE" : "POST";
    await fetch(`/api/admin/zones/${selectedZoneId}/stores`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store.id }),
    });
    setZoneDetail((prev) =>
      prev
        ? {
            ...prev,
            stores: prev.stores.map((s) => (s.id === store.id ? { ...s, inZone: !s.inZone } : s)),
          }
        : prev
    );
    setSelectedStoreId(null);
  };

  const filteredStores = useMemo(() => {
    if (!zoneDetail) return [];
    if (!storeSearch) return zoneDetail.stores;
    const lower = storeSearch.toLowerCase();
    return zoneDetail.stores.filter((store) => {
      const name = getLocalizedName(store.nameTranslations, locale, store.name);
      return name.toLowerCase().includes(lower) || store.address?.toLowerCase().includes(lower);
    });
  }, [zoneDetail, storeSearch, locale]);

  const selectedMapStore = useMemo(() => {
    if (!selectedStoreId || !zoneDetail) return null;
    return zoneDetail.stores.find((s) => s.id === selectedStoreId) || null;
  }, [selectedStoreId, zoneDetail]);

  const renderMap = () => {
    if (!isLoaded) {
      return (
        <div className="h-[480px] flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t(locale, "loading")}
        </div>
      );
    }

    return (
      <div ref={mapContainerRef} onContextMenu={(e) => e.preventDefault()}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
          zoom={mapZoom}
        center={mapCenter}
          onLoad={onMapLoad}
          onMouseUp={() => endPolygonDrag()}
          onMouseMove={(e) => {
            if (isDraggingPolygon.current && e.latLng) {
              handlePolygonDrag(e.latLng);
            }
          }}
        options={{
          streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
        }}
      >
        {zones.map((zone, idx) => {
          const coords = Array.isArray(zone.coordinates) ? zone.coordinates : [];
          if (coords.length === 0) return null;
          const isSelected = zone.id === selectedZoneId;
          const baseColor = polygonColors[idx % polygonColors.length];

          return (
          <Polygon
            key={zone.id}
              path={isSelected ? editedPath : coords}
            options={{
                strokeColor: baseColor,
                fillColor: baseColor,
                fillOpacity: isSelected ? 0.32 : 0.06,
                strokeWeight: isSelected ? 3 : 1.5,
                editable: isSelected,
                draggable: false,
                clickable: true,
            }}
              onMouseUp={() => {
                if (isSelected && isDraggingPolygon.current) {
                  endPolygonDrag();
                }
              }}
              onMouseMove={(e) => {
                if (isSelected && isDraggingPolygon.current && e.latLng) {
                  handlePolygonDrag(e.latLng);
                }
              }}
              onLoad={isSelected ? onPolygonLoad : undefined}
              onClick={() => {
                setVertexMenu(null);
                if (!isSelected) setSelectedZoneId(zone.id);
              }}
              onMouseDown={(e) => {
                if (!isSelected) return;
                setVertexMenu(null);
                const domEvt = (e as any)?.domEvent as MouseEvent | undefined;
                const ctrl = domEvt?.ctrlKey || domEvt?.metaKey;
                if (ctrl && e.latLng) {
                  domEvt?.preventDefault?.();
                  domEvt?.stopPropagation?.();
                  startPolygonDrag(e.latLng);
                }
              }}
              onRightClick={(e) => {
                if (!isSelected) return;
                const domEvt = (e as any).domEvent as MouseEvent | undefined;
                domEvt?.preventDefault?.();
                domEvt?.stopPropagation?.();
                const vIndex = (e as any).vertex;
                if (vIndex === undefined || vIndex === null || vIndex < 0) return;
                setVertexMenu({
                  index: vIndex,
                  x: domEvt?.pageX || 0,
                  y: domEvt?.pageY || 0,
                });
              }}
          />
          );
        })}

        {zoneDetail?.stores
          ?.filter((store) => store.latitude && store.longitude)
          .map((store) => (
            <Marker
              key={store.id}
              position={{ lat: store.latitude, lng: store.longitude }}
              icon={{
                path: window.google?.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 5,
                fillColor: store.inZone ? "#22c55e" : "#ef4444",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
              }}
              onClick={() => setSelectedStoreId(store.id)}
              title={getLocalizedName(store.nameTranslations, locale, store.name)}
            />
          ))}

          {selectedMapStore && (
            <InfoWindow
              position={{ lat: selectedMapStore.latitude, lng: selectedMapStore.longitude }}
              onCloseClick={() => setSelectedStoreId(null)}
            >
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    {getLocalizedName(selectedMapStore.nameTranslations, locale, selectedMapStore.name)}
                  </span>
                </div>
                {selectedMapStore.address && (
                  <p className="text-xs text-gray-500 mb-2">{selectedMapStore.address}</p>
                )}
                {selectedMapStore.city && (
                  <p className="text-xs text-gray-500 mb-2">{selectedMapStore.city}</p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                      selectedMapStore.inZone ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    <MapPin className="h-3 w-3" />
                    {selectedMapStore.inZone ? t(locale, "inZone") : t(locale, "outside")}
                  </span>
                  <button
                    onClick={() => toggleStore(selectedMapStore)}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      selectedMapStore.inZone
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {selectedMapStore.inZone ? t(locale, "removeFromZone") : t(locale, "addToZone")}
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
      </GoogleMap>

        {vertexMenu && (
          <div
            data-vertex-menu
            className="fixed z-[80] bg-white border border-gray-200 rounded-md shadow-lg"
            style={{ top: vertexMenu.y, left: vertexMenu.x }}
          >
            <button
              onClick={handleDeleteVertex}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              Delete vertex
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTranslationInputs = () => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{t(locale, "zoneNameTranslations")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <div key={lang}>
            <label className="text-xs uppercase text-gray-500">{lang}</label>
            <input
              type="text"
              value={editedTranslations[lang] || ""}
              onChange={(e) =>
                setEditedTranslations((prev) => ({ ...prev, [lang]: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder={`${t(locale, "name")} (${lang.toUpperCase()})`}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative flex gap-6 h-full">
      {/* Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile open tab */}
      <button
        className="md:hidden fixed left-0 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center h-14 w-7 rounded-r-full bg-indigo-600 text-white shadow-lg"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open zones panel"
      >
        <span className="sr-only">Open zones</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          "bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 flex flex-col transition-all",
          "md:w-72 md:static md:flex",
          mobileSidebarOpen ? "fixed inset-0 left-0 z-60 w-72 shadow-2xl md:shadow-none" : "hidden md:flex"
        )}
      >
        {/* Mobile close */}
        <div className="md:hidden flex justify-between items-center mb-3">
          <span className="font-bold text-slate-800">{t(locale, "zones")}</span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t(locale, "cancel")}
          </button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 border border-slate-200/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t(locale, "searchZones")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
            title={t(locale, "addZone")}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredZones.map((zone) => {
            const name = getLocalizedName(zone.nameTranslations, locale, zone.name);
            return (
              <div
                key={zone.id}
                className={`flex items-center gap-1 rounded-xl text-sm transition-all ${
                  zone.id === selectedZoneId 
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60" 
                    : "hover:bg-slate-50"
                }`}
              >
                <button
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex-1 text-left px-3 py-2.5 font-medium ${
                    zone.id === selectedZoneId ? "text-amber-700" : "text-slate-700"
                  }`}
                >
                  {name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoneToDelete(zone);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-1"
                  title={t(locale, "deleteZone")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {!filteredZones.length && (
            <p className="text-sm text-slate-400 text-center py-6">{t(locale, "noZonesFound")}</p>
          )}
        </div>
      </div>

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
                  {renderTranslationInputs()}
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
                {renderMap()}
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
              {/* Stores table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">{t(locale, "stores")}</h3>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 border border-slate-200/60">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t(locale, "searchStores")}
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-sm py-2 placeholder-slate-400"
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left text-gray-500 uppercase text-xs">
                        <th className="py-2">{t(locale, "name")}</th>
                        <th className="py-2">{t(locale, "status")}</th>
                        <th className="py-2">{t(locale, "action")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores.map((store) => (
                        <tr key={store.id} className="border-t hover:bg-gray-50">
                          <td className="py-2">
                            <div className="font-medium text-gray-900">
                              {getLocalizedName(store.nameTranslations, locale, store.name)}
                            </div>
                            <div className="text-xs text-gray-500">{store.address}</div>
                          </td>
                          <td className="py-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                                store.inZone ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <MapPin className="h-3 w-3" />
                              {store.inZone ? t(locale, "inZone") : t(locale, "outside")}
                            </span>
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => toggleStore(store)}
                              className={`text-sm font-medium ${
                                store.inZone ? "text-red-600" : "text-indigo-600"
                              } hover:underline`}
                            >
                              {store.inZone ? t(locale, "remove") : t(locale, "add")}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredStores.length && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-sm text-gray-400">
                            {t(locale, "noStoresFound")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Users table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t(locale, "usersInZone")}</h3>
                <div className="max-h-72 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left text-gray-500 uppercase text-xs">
                        <th className="py-2">{t(locale, "user")}</th>
                        <th className="py-2">{t(locale, "address")}</th>
                        <th className="py-2 text-center">{t(locale, "open")}</th>
                        <th className="py-2 text-center">{t(locale, "delivered")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneDetail.users.map((user) => (
                        <tr key={user.id} className="border-t hover:bg-gray-50">
                          <td className="py-2">
                            <div className="font-medium text-gray-900">
                              {[user.firstName, user.lastName].filter(Boolean).join(" ") || t(locale, "unknown")}
                            </div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </td>
                          <td className="py-2 text-xs text-gray-600">
                            {[user.address, user.city, user.state, user.country, user.postalCode]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                          <td className="py-2 text-center text-indigo-600 font-semibold">{user.openCarts}</td>
                          <td className="py-2 text-center text-green-600 font-semibold">{user.completedCarts}</td>
                        </tr>
                      ))}
                      {!zoneDetail.users.length && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-sm text-gray-400">
                            {t(locale, "noUsersInZone")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Zone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {t(locale, "addZone")}
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t(locale, "zoneName")}
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder={t(locale, "zoneNamePrompt")}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddZone()}
              />
            </div>
            <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => { setShowAddModal(false); setNewZoneName(""); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                {t(locale, "cancel")}
              </button>
              <button
                onClick={handleAddZone}
                disabled={!newZoneName.trim()}
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
              >
                {t(locale, "add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Zone Confirmation Modal */}
      {zoneToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {t(locale, "deleteZone")}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                {t(locale, "deleteZoneConfirm")}
              </p>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="font-semibold text-red-800">
                  {getLocalizedName(zoneToDelete.nameTranslations, locale, zoneToDelete.name)}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setZoneToDelete(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                {t(locale, "cancel")}
              </button>
              <button
                onClick={() => handleDeleteZone(zoneToDelete)}
                className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all"
              >
                {t(locale, "delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesAdminPage;
