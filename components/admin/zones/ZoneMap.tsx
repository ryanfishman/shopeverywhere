"use client";

import { useCallback, useRef, useEffect } from "react";
import { GoogleMap, Polygon, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Store, Loader2 } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import { MAP_CONTAINER_STYLE, POLYGON_COLORS } from "@/lib/api";
import type { ZoneSummary, StoreInfo, LatLng } from "@/lib/api";

interface ZoneMapProps {
  isLoaded: boolean;
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  editedPath: LatLng[];
  stores: StoreInfo[];
  selectedStoreId: string | null;
  mapCenter: LatLng;
  mapZoom: number;
  onSelectZone: (zoneId: string) => void;
  onEditPath: (path: LatLng[]) => void;
  onSelectStore: (storeId: string | null) => void;
  onToggleStore: (store: StoreInfo) => void;
  onMapLoad: (map: google.maps.Map) => void;
  locale: string;
}

export const ZoneMap = ({
  isLoaded,
  zones,
  selectedZoneId,
  editedPath,
  stores,
  selectedStoreId,
  mapCenter,
  mapZoom,
  onSelectZone,
  onEditPath,
  onSelectStore,
  onToggleStore,
  onMapLoad,
  locale,
}: ZoneMapProps) => {
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingPolygon = useRef(false);
  const dragStartLatLng = useRef<google.maps.LatLng | null>(null);
  const dragStartPath = useRef<LatLng[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [vertexMenu, setVertexMenu] = React.useState<{ index: number; x: number; y: number } | null>(null);

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
      const target = e.target as HTMLElement;
      if (!target.closest('[data-vertex-menu]')) {
        setVertexMenu(null);
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickAway);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickAway);
    };
  }, [vertexMenu]);

  const onEdit = useCallback(() => {
    if (polygonRef.current) {
      const path = polygonRef.current.getPath();
      const updated = path.getArray().map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));
      onEditPath(updated);
    }
  }, [onEditPath]);

  const onPolygonLoad = useCallback((polygon: google.maps.Polygon) => {
    polygonRef.current = polygon;
    const path = polygon.getPath();
    google.maps.event.addListener(path, "set_at", onEdit);
    google.maps.event.addListener(path, "insert_at", onEdit);
    google.maps.event.addListener(path, "remove_at", onEdit);
  }, [onEdit]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    onMapLoad(map);
  }, [onMapLoad]);

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
    onEditPath(newPath);
  }, [onEditPath]);

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

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || null;

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
        onLoad={handleMapLoad}
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
          const baseColor = POLYGON_COLORS[idx % POLYGON_COLORS.length];

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
                if (!isSelected) onSelectZone(zone.id);
              }}
              onMouseDown={(e) => {
                if (!isSelected) return;
                setVertexMenu(null);
                const domEvt = (e as unknown as { domEvent: MouseEvent })?.domEvent;
                const ctrl = domEvt?.ctrlKey || domEvt?.metaKey;
                if (ctrl && e.latLng) {
                  domEvt?.preventDefault?.();
                  domEvt?.stopPropagation?.();
                  startPolygonDrag(e.latLng);
                }
              }}
              onRightClick={(e) => {
                if (!isSelected) return;
                const domEvt = (e as unknown as { domEvent: MouseEvent }).domEvent;
                domEvt?.preventDefault?.();
                domEvt?.stopPropagation?.();
                const vIndex = (e as unknown as { vertex: number }).vertex;
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

        {stores
          .filter((store) => store.latitude && store.longitude)
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
              onClick={() => onSelectStore(store.id)}
              title={getLocalizedName(store.nameTranslations, locale, store.name)}
            />
          ))}

        {selectedStore && (
          <InfoWindow
            position={{ lat: selectedStore.latitude, lng: selectedStore.longitude }}
            onCloseClick={() => onSelectStore(null)}
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  {getLocalizedName(selectedStore.nameTranslations, locale, selectedStore.name)}
                </span>
              </div>
              {selectedStore.address && (
                <p className="text-xs text-gray-500 mb-2">{selectedStore.address}</p>
              )}
              {selectedStore.city && (
                <p className="text-xs text-gray-500 mb-2">{selectedStore.city}</p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    selectedStore.inZone ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  {selectedStore.inZone ? t(locale, "inZone") : t(locale, "outside")}
                </span>
                <button
                  onClick={() => onToggleStore(selectedStore)}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    selectedStore.inZone
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {selectedStore.inZone ? t(locale, "removeFromZone") : t(locale, "addToZone")}
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

// Need to import React for useState
import React from "react";

