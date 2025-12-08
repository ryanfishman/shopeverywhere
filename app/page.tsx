"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ShoppingCart, Globe, Menu, Shield } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AccountDropdown } from "@/components/AccountDropdown";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";

// Import API services
import {
  fetchCart as apiFetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  parseCartLocation,
  parseCartItems,
  updateCartItemsAfterAdd,
  updateCartItemQuantity,
  removeCartItem,
  fetchCategories as apiFetchCategories,
  fetchProducts as apiFetchProducts,
  extractUniqueStores,
  filterProductsByStores,
  mergeProducts,
  checkLocation,
  saveLocation,
  reverseGeocode,
  geocodeAddress,
  buildAddressString,
  getCurrentPosition,
  isGeolocationAvailable,
  saveLocationToStorage,
  loadLocationFromStorage,
  saveCartIdToStorage,
  loadCartIdFromStorage,
  fetchUserProfile,
  extractProfileLocation,
  getProfileZone,
} from "@/lib/api";
import type {
  Category,
  Product,
  LocationDetails,
  ZoneInfo,
  CartItem,
} from "@/lib/api";

// Import shop components
import {
  translations,
  CategoryPicker,
  LocationModal,
  ZoneChangeWarningModal,
  CartDrawer,
  StoreFilter,
  DesktopSearchWithFilter,
  MobileSearchWithFilter,
  ProductGrid,
  ProductModal,
  Drawer,
} from "@/components/shop";
import type { Store, LocationPayload } from "@/components/shop";

export default function ShopPage() {
  const { data: session } = useSession();

  // Google Maps
  const { isLoaded: mapsLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [pendingStoreIds, setPendingStoreIds] = useState<Set<string>>(new Set());

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [geolocationAvailable, setGeolocationAvailable] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartDataLoaded, setCartDataLoaded] = useState(false);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [addressLoadedFromBackend, setAddressLoadedFromBackend] = useState(false);
  const cartFetchedRef = useRef(false);
  const profileFetchedRef = useRef(false);

  // Location
  const [, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoneInfo, setZoneInfo] = useState<ZoneInfo | null>(null);
  const [addressDetails, setAddressDetails] = useState<LocationDetails | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [addressForm, setAddressForm] = useState({ address: "", city: "", state: "", postalCode: "", country: "" });
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 45.5017, lng: -73.5673 });
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [showZoneChangeWarning, setShowZoneChangeWarning] = useState(false);
  const [pendingLocationData, setPendingLocationData] = useState<{
    payload: LocationPayload;
    newZone: ZoneInfo;
    location: LocationDetails;
  } | null>(null);

  // Locale
  const [locale, setLocale] = useState("en");

  // Helper for translations
  const t = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;

  // Extract unique stores from products
  const uniqueStores: Store[] = useMemo(() => extractUniqueStores(products), [products]);

  // Filter products by selected stores
  const filteredProducts = useMemo(
    () => filterProductsByStores(products, selectedStoreIds),
    [products, selectedStoreIds]
  );

  // Store filter handlers
  const toggleStoreFilter = (storeId: string) => {
    setPendingStoreIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storeId)) {
        newSet.delete(storeId);
      } else {
        newSet.add(storeId);
      }
      return newSet;
    });
  };

  const toggleAllStores = () => {
    if (pendingStoreIds.size === uniqueStores.length) {
      setPendingStoreIds(new Set());
    } else {
      setPendingStoreIds(new Set(uniqueStores.map(s => s.id)));
    }
  };

  const applyStoreFilter = () => {
    setSelectedStoreIds(new Set(pendingStoreIds));
    setShowAdvancedSearch(false);
  };

  const clearStoreFilter = () => {
    setPendingStoreIds(new Set());
  };

  const openFilterPanel = () => {
    setPendingStoreIds(new Set(selectedStoreIds));
    setShowAdvancedSearch(true);
  };

  // Open location modal with pre-populated data
  const openLocationModal = useCallback(() => {
    if (addressDetails) {
      setAddressForm({
        address: addressDetails.address || "",
        city: addressDetails.city || "",
        state: addressDetails.state || "",
        postalCode: addressDetails.postalCode || "",
        country: addressDetails.country || "",
      });
      if (addressDetails.latitude && addressDetails.longitude) {
        setMapMarker({ lat: addressDetails.latitude, lng: addressDetails.longitude });
        setMapCenter({ lat: addressDetails.latitude, lng: addressDetails.longitude });
      }
    }
    setShowLocationModal(true);
  }, [addressDetails]);

  // Update map/location state helper
  const updateLocationState = useCallback((location: LocationDetails) => {
    setAddressDetails(location);
    if (location.latitude && location.longitude) {
      setUserLocation({ lat: location.latitude, lng: location.longitude });
      setMapMarker({ lat: location.latitude, lng: location.longitude });
      setMapCenter({ lat: location.latitude, lng: location.longitude });
    }
  }, []);

  // Fetch cart from backend
  const fetchCart = useCallback(async (existingCartId?: string | null, skipIfFetched = false) => {
    if (skipIfFetched && cartFetchedRef.current) return;
    cartFetchedRef.current = true;

    try {
      const data = await apiFetchCart(existingCartId);

      if (data.cartId) {
        setCartId(data.cartId);
        saveCartIdToStorage(data.cartId);
      }

      setCartItems(parseCartItems(data));

      const cartLocation = parseCartLocation(data);
      if (cartLocation) {
        updateLocationState(cartLocation.location);
        setAddressLoadedFromBackend(true);
        setAutoLocationRequested(true);
        if (cartLocation.zone) {
          setZoneInfo(cartLocation.zone);
        }
        saveLocationToStorage(cartLocation.location, cartLocation.zone);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setCartDataLoaded(true);
    }
  }, [updateLocationState]);

  // Sync cart operations
  const syncCartAdd = useCallback(async (product: Product, quantity: number = 1) => {
    try {
      const data = await addToCart(product.id, quantity, cartId);
      if (data.cartId && !cartId) {
        setCartId(data.cartId);
        saveCartIdToStorage(data.cartId);
      }
    } catch (error) {
      console.error("Error syncing cart:", error);
    }
  }, [cartId]);

  const syncCartUpdate = useCallback(async (productId: string, quantity: number) => {
    if (!cartId) return;
    try {
      await updateCartItem(productId, quantity, cartId);
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  }, [cartId]);

  const syncCartRemove = useCallback(async (productId: string) => {
    if (!cartId) return;
    try {
      await removeFromCart(productId, cartId);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  }, [cartId]);

  // Init
  useEffect(() => {
    // Fetch categories
    apiFetchCategories().then(setCategories);

    if (typeof window !== "undefined") {
      setGeolocationAvailable(isGeolocationAvailable());

      // Load locale
      const savedLocale = localStorage.getItem("locale");
      if (savedLocale) setLocale(savedLocale);
      else if (window.navigator?.language) setLocale(window.navigator.language.split("-")[0] || "en");

      // Load stored location
      const storedLocation = loadLocationFromStorage();
      if (storedLocation) {
        updateLocationState(storedLocation.location);
        if (storedLocation.zone) {
          setZoneInfo(storedLocation.zone);
        }
      }

      // Load cart ID and fetch cart
      const storedCartId = loadCartIdFromStorage();
      if (storedCartId) setCartId(storedCartId);
      fetchCart(storedCartId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user profile on session change
  useEffect(() => {
    if (!session?.user) {
      profileFetchedRef.current = false;
      setProfileDataLoaded(true);
      return;
    }
    if (profileFetchedRef.current) return;
    profileFetchedRef.current = true;

    const loadProfile = async () => {
      try {
        const profile = await fetchUserProfile();
        if (!profile) {
          setProfileDataLoaded(true);
          return;
        }

        if (profile.cartId) {
          setCartId(profile.cartId);
          saveCartIdToStorage(profile.cartId);
        }

        const zone = getProfileZone(profile);
        if (zone) {
          setZoneInfo(zone);
        }

        const location = extractProfileLocation(profile);
        if (location) {
          updateLocationState(location);
          setAddressLoadedFromBackend(true);
          setAutoLocationRequested(true);
          saveLocationToStorage(location, zone);
        }

        // Refresh cart for logged-in user
        cartFetchedRef.current = false;
        setCartDataLoaded(false);
        fetchCart(profile.cartId);
      } catch (error) {
        console.error(error);
      } finally {
        setProfileDataLoaded(true);
      }
    };

    loadProfile();
  }, [session, fetchCart, updateLocationState]);

  // Product Fetching
  useEffect(() => {
    if (zoneInfo?.zoneId && zoneInfo.inZone) {
      loadProducts();
    } else {
      setProducts([]);
      setHasMore(false);
    }
  }, [zoneInfo, selectedCategory, debouncedSearchQuery, page]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadProducts = async () => {
    if (!zoneInfo?.zoneId || !zoneInfo.inZone) {
      setHasMore(false);
      setProducts([]);
      return;
    }

    setLoadingProducts(true);
    try {
      const data = await apiFetchProducts({
        zoneId: zoneInfo.zoneId,
        page,
        searchQuery: debouncedSearchQuery,
        categoryId: selectedCategory,
      });

      setProducts(prev => mergeProducts(prev, data.products, page === 1));
      setHasMore(page < data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Check zone and optionally persist location
  const checkAndUpdateLocation = useCallback(async (payload: LocationPayload, manual = false) => {
    const translate = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;
    setResolvingLocation(true);

    try {
      const checkData = await checkLocation(payload, cartId);

      if (!checkData || !checkData.inZone) {
        if (manual) {
          setLocationNotice({ type: "error", message: checkData?.error || translate('locationMissing') });
        }
        setResolvingLocation(false);
        return;
      }

      if (manual && checkData.zoneChanged && checkData.currentZoneId) {
        setPendingLocationData({
          payload,
          newZone: checkData.newZone,
          location: checkData.location,
        });
        setShowZoneChangeWarning(true);
        setResolvingLocation(false);
        return;
      }

      await persistLocation(payload, manual);
    } catch (error) {
      console.error(error);
      if (manual) {
        setLocationNotice({ type: "error", message: translations[locale]?.['locationMissing'] || translations['en']['locationMissing'] });
      }
      setResolvingLocation(false);
    }
  }, [cartId, locale]);

  // Persist location to backend
  const persistLocation = useCallback(async (payload: LocationPayload, manual = false) => {
    const translate = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;
    setResolvingLocation(true);
    if (manual) setLocationNotice(null);

    try {
      const data = await saveLocation(payload, cartId);

      if (data.cartId) {
        setCartId(data.cartId);
        saveCartIdToStorage(data.cartId);
      }

      if (data.location) {
        updateLocationState(data.location);
      }

      setZoneInfo(data.zone || null);
      saveLocationToStorage(data.location, data.zone);

      // Refresh cart if items were removed or zone changed
      if (data.removedItems || data.zone?.zoneId) {
        cartFetchedRef.current = false;
        await fetchCart(data.cartId);
      }

      if (manual) {
        if (data.removedItems) {
          setLocationNotice({
            type: "warning",
            message: translate('locationRemovedItems').replace("{count}", String(data.removedItems)),
          });
        } else if (data.zone?.inZone) {
          setLocationNotice({ type: "success", message: translate('locationSaved') });
        } else {
          setLocationNotice({ type: "warning", message: translate('locationMissing') });
        }
      }

      setShowLocationModal(false);
      setAddressForm({ address: "", city: "", state: "", postalCode: "", country: "" });
    } catch (error) {
      console.error(error);
      if (manual) {
        setLocationNotice({ type: "error", message: translate('locationMissing') });
      }
    } finally {
      setResolvingLocation(false);
    }
  }, [cartId, locale, fetchCart, updateLocationState]);

  // Zone change handlers
  const handleConfirmZoneChange = useCallback(async () => {
    if (!pendingLocationData) return;
    setShowZoneChangeWarning(false);
    await persistLocation(pendingLocationData.payload, true);
    setPendingLocationData(null);
  }, [pendingLocationData, persistLocation]);

  const handleCancelZoneChange = useCallback(() => {
    setShowZoneChangeWarning(false);
    setPendingLocationData(null);
    setResolvingLocation(false);
  }, []);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkAndUpdateLocation(addressForm, true);
  };

  // Use current location for form fields (in modal)
  const handleUseCurrentLocationForFields = async () => {
    try {
      setResolvingLocation(true);
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setMapMarker({ lat, lng });
      setMapCenter({ lat, lng });

      const address = await reverseGeocode(lat, lng);
      if (address) {
        setAddressForm(address);
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      const tLocal = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;

      let message = tLocal('locationUnavailable');
      if (geoError.code === 1) message = tLocal('locationPermissionDenied');
      else if (geoError.code === 3) message = tLocal('locationTimeout');

      setLocationNotice({ type: "error", message });
    } finally {
      setResolvingLocation(false);
    }
  };

  // Auto-detect location and save
  const handleUseCurrentLocation = async (manual = true) => {
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      await checkAndUpdateLocation({ lat, lng }, manual);
    } catch (error) {
      if (manual) {
        const geoError = error as GeolocationPositionError;
        const tLocal = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;

        let message = tLocal('locationUnavailable');
        if (geoError.code === 1) message = tLocal('locationPermissionDenied');
        else if (geoError.code === 3) message = tLocal('locationTimeout');

        setLocationNotice({ type: "error", message });
      }
    }
  };

  // Debounce geocoding for address fields
  useEffect(() => {
    if (!showLocationModal || !mapsLoaded) return;

    const timer = setTimeout(async () => {
      const addressString = buildAddressString(addressForm);
      const coords = await geocodeAddress(addressString);
      if (coords) {
        setMapMarker(coords);
        setMapCenter(coords);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [addressForm, showLocationModal, mapsLoaded]);

  // Auto-detect location on initial load
  useEffect(() => {
    if (!geolocationAvailable) return;
    if (!cartDataLoaded || !profileDataLoaded) return;
    if (addressLoadedFromBackend) return;
    if (addressDetails || autoLocationRequested) return;

    setAutoLocationRequested(true);
    handleUseCurrentLocation(false);
  }, [geolocationAvailable, cartDataLoaded, profileDataLoaded, addressLoadedFromBackend, addressDetails, autoLocationRequested]);

  // Handle map click from LocationModal
  const handleMapClick = async (lat: number, lng: number) => {
    setMapMarker({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    if (address) {
      setAddressForm(address);
    }
  };

  // Cart operations
  const handleCartUpdateQuantity = (productId: string, quantity: number) => {
    syncCartUpdate(productId, quantity);
    setCartItems(prev => updateCartItemQuantity(prev, productId, quantity));
  };

  const handleCartRemove = (productId: string) => {
    syncCartRemove(productId);
    setCartItems(prev => removeCartItem(prev, productId));
  };

  const handleCheckout = () => {
    localStorage.setItem("se_checkout_cart", JSON.stringify(cartItems));
    setIsCartOpen(false);
    window.location.href = "/checkout";
  };

  // Product modal handlers
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductQuantity(1);
    setShowProductModal(true);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    setAddingToCart(true);
    await syncCartAdd(selectedProduct, productQuantity);
    setCartItems(prev => updateCartItemsAfterAdd(prev, selectedProduct, productQuantity));
    setAddingToCart(false);
    setShowProductModal(false);
    setSelectedProduct(null);
    setProductQuantity(1);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-stone-100">
      {/* Navbar + Mobile Search (sticky together) */}
      <div className="sticky top-0 z-40">
        <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            {/* Brand + Hamburger */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-black text-sm">SE</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent hidden sm:block">{t('brandName')}</span>
              </Link>
              <button className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Search - Center */}
            <DesktopSearchWithFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterClick={openFilterPanel}
              filterCount={selectedStoreIds.size}
              placeholder={t('searchPlaceholder')}
              filterTitle={t('filterStore')}
            />

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Locale */}
              <div className="hidden sm:block">
                <LanguagePicker
                  locale={locale}
                  onChange={(l) => {
                    setLocale(l);
                    localStorage.setItem("locale", l);
                  }}
                />
              </div>

              {/* Location */}
              <button onClick={openLocationModal} className="p-2 text-white/70 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors">
                <Globe className="h-5 w-5" />
              </button>

              {session?.user && (session.user as { isAdmin?: boolean }).isAdmin && (
                <Link href="/admin/zones" className="p-2 text-white/70 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors">
                  <Shield className="h-5 w-5" />
                </Link>
              )}

              {/* Cart */}
              <button onClick={() => setIsCartOpen(true)} className="p-2 text-white/70 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              {/* User */}
              <AccountDropdown />
            </div>
          </div>
        </nav>

        {/* Mobile Search */}
        <MobileSearchWithFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={openFilterPanel}
          filterCount={selectedStoreIds.size}
          placeholder={t('searchPlaceholder')}
          filterTitle={t('filterStore')}
        />
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar - Categories (Desktop) */}
        <aside className={`hidden lg:block w-72 flex-shrink-0 transition-all ${isCategoriesOpen ? '' : '-ml-72'}`}>
          <CategoryPicker
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => {
              setSelectedCategory(id);
              setPage(1);
            }}
            locale={locale}
            t={t}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {locationNotice && (
            <div
              className={`mb-6 rounded-xl px-5 py-4 text-sm font-medium shadow-sm flex items-center justify-between ${
                locationNotice.type === "success"
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60"
                  : locationNotice.type === "warning"
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/60"
                    : "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200/60"
              }`}
            >
              <span>{locationNotice.message}</span>
              <button
                onClick={() => setLocationNotice(null)}
                className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${
                  locationNotice.type === "success" ? "text-emerald-600"
                    : locationNotice.type === "warning" ? "text-amber-600"
                      : "text-rose-600"
                }`}
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
          )}

          {addressDetails && (
            <div className="mb-6 flex flex-wrap items-center justify-between rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-5 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">{t('setLocationButton')}</p>
                  <p className="text-lg font-semibold text-white">
                    {addressDetails.address || addressDetails.city || addressDetails.country}
                  </p>
                  <p className="text-sm text-slate-400">
                    {[addressDetails.city, addressDetails.state, addressDetails.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              <button onClick={openLocationModal} className="mt-3 sm:mt-0 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl">
                {t('changeLocation')}
              </button>
            </div>
          )}

          {!zoneInfo ? (
            <div className="text-center py-20 px-6 bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-xl border border-slate-200/60">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 rotate-3">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('needLocationTitle')}</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                {session
                  ? t('authLocationMessage')
                  : (
                    <>
                      {t('guestLocationMessage')}{" "}
                      <Link href="/auth/login" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">{t('signIn')}</Link>
                      {" / "}
                      <Link href="/auth/register" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">{t('signUp')}</Link>
                    </>
                  )}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <button onClick={openLocationModal} className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all">
                  {t('enterAddressCta')}
                </button>
                {geolocationAvailable && (
                  <button onClick={() => handleUseCurrentLocation(true)} className="px-8 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-amber-300 hover:text-amber-600 transition-all">
                    {t('useCurrentLocation')}
                  </button>
                )}
              </div>
            </div>
          ) : !zoneInfo.inZone ? (
            <div className="text-center py-20 px-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-xl border border-amber-200/60">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">{t('outsideAreaTitle')}</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">{t('outsideAreaMessage')}</p>
              <button onClick={openLocationModal} className="px-8 py-3.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-600 shadow-lg transition-all">
                {t('changeLocation')}
              </button>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
              locale={locale}
              onProductClick={handleProductClick}
              loading={loadingProducts}
              hasMore={hasMore}
              onLoadMore={() => setPage(p => p + 1)}
              t={t}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white py-16 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">SE</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">{t('brandName')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="w-12 h-px bg-gradient-to-r from-transparent to-slate-700"></span>
              <p>&copy; 2025 {t('footerRights')}</p>
              <span className="w-12 h-px bg-gradient-to-l from-transparent to-slate-700"></span>
            </div>
          </div>
        </div>
      </footer>

      {/* --- Modals & Drawers --- */}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleCartUpdateQuantity}
        onRemove={handleCartRemove}
        onCheckout={handleCheckout}
        t={t}
      />

      {/* Store Filter */}
      <StoreFilter
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        stores={uniqueStores}
        selectedStoreIds={pendingStoreIds}
        onToggleStore={toggleStoreFilter}
        onToggleAll={toggleAllStores}
        onApply={applyStoreFilter}
        onClear={clearStoreFilter}
        t={t}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSubmit={handleAddressSubmit}
        addressForm={addressForm}
        onAddressChange={setAddressForm}
        mapCenter={mapCenter}
        mapMarker={mapMarker}
        onMapClick={handleMapClick}
        onUseCurrentLocation={handleUseCurrentLocationForFields}
        geolocationAvailable={geolocationAvailable}
        resolvingLocation={resolvingLocation}
        t={t}
      />

      {/* Zone Change Warning Modal */}
      <ZoneChangeWarningModal
        isOpen={showZoneChangeWarning}
        newZoneName={pendingLocationData?.newZone?.inZone ? pendingLocationData.newZone.zoneName : undefined}
        resolvingLocation={resolvingLocation}
        onConfirm={handleConfirmZoneChange}
        onCancel={handleCancelZoneChange}
        t={t}
      />

      {/* Mobile Categories Sidebar */}
      <Drawer title={t('menu')} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} side="left">
        <div className="space-y-4">
          {/* Language Picker for Mobile */}
          <div className="pb-3 border-b border-slate-200">
            <h3 className="font-bold mb-2">{t('language')}</h3>
            <LanguagePicker
              locale={locale}
              onChange={(l) => {
                setLocale(l);
                localStorage.setItem("locale", l);
              }}
              variant="dark"
            />
          </div>
          <h3 className="font-bold">{t('categories')}</h3>
          <CategoryPicker
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => {
              setSelectedCategory(id);
              setPage(1);
              setIsMobileMenuOpen(false);
            }}
            locale={locale}
            t={t}
          />
        </div>
      </Drawer>

      {/* Product Modal */}
      <ProductModal
        isOpen={showProductModal}
        product={selectedProduct}
        quantity={productQuantity}
        onQuantityChange={setProductQuantity}
        onAddToCart={handleAddToCart}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
          setProductQuantity(1);
        }}
        isAddingToCart={addingToCart}
        locale={locale}
        t={t}
      />
    </div>
  );
}
