"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, ShoppingCart, Globe, Menu, ChevronRight, ChevronDown, Filter, X, Shield, Building2, FolderTree, Minus, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { AccountDropdown } from "@/components/AccountDropdown";
import { LanguagePicker } from "@/components/LanguagePicker";
import { getLocalizedName } from "@/lib/i18n";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";

// --- Types ---
interface Category {
  id: string;
  nameTranslations: Record<string, string>;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  nameTranslations?: Record<string, string>;
  description: string;
  shortDescriptionTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
  imageUrl: string;
  minPrice: number;
  ownerStoreName: string;
  storeId?: string;
  categoryTranslations?: Record<string, string>;
}

interface LocationDetails {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

type LocationPayload = {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
};

type Translations = {
    [key: string]: {
        [key: string]: string;
    }
}

// --- Translations ---
const translations: Translations = {
    en: {
        brandName: "ShopEverywhere",
        searchPlaceholder: "Search products...",
        filterStore: "Filter by Store",
        selectAll: "Select All",
        signIn: "Sign In",
        signUp: "Sign Up",
        signOut: "Sign Out",
        myDetails: "My Details",
        previousOrders: "Previous Orders",
        categories: "Categories",
        clear: "Clear",
        whereAreYouShopping: "Where are you shopping?",
        setLocationMessage: "Set your location to find deals near you.",
        setLocationButton: "Set Location",
        outsideAreaTitle: "Outside Service Area",
        outsideAreaMessage: "Sorry, we don't currently operate in your zone.",
        noProducts: "No products found.",
        loading: "Loading...",
        loadMore: "Load More",
        from: "From",
        footerRights: "ShopEverywhere. All rights reserved.",
        cartEmpty: "Your cart is empty",
        cartTitle: "Shopping Cart",
        addToCart: "Add to Cart",
        subtotal: "Subtotal",
        checkout: "Checkout",
        menu: "Menu",
        selectLocationTitle: "Select Location",
        enterAddressPlaceholder: "Enter your address...",
        searchButton: "Search",
        googleMapWidget: "Google Map Widget",
        useMockLocation: "Use Mock Montreal Location",
        useCurrentLocation: "Use current location",
        save: "Save",
        cancel: "Cancel",
        fullName: "Full Name",
        email: "Email",
        shippingAddress: "Shipping Address",
        categoryLabel: "Category",
        uncategorized: "Uncategorized",
        city: "City",
        state: "State / Province",
        country: "Country",
        postalCode: "Postal Code",
        needLocationTitle: "Shop anywhere, starting with your location",
        guestLocationMessage: "Enter your address to start shopping, or",
        authLocationMessage: "Add your delivery address to continue.",
        enterAddressCta: "Enter address",
        pickLocationCta: "Pick a location",
        changeLocation: "Change location",
        locationSaved: "Location saved! Showing stores near you.",
        locationRemovedItems: "We removed {count} item(s) unavailable in this zone.",
        locationMissing: "We couldn't match that address to a service zone. Please try again.",
        locationPermissionDenied: "Location access was denied. Please enable location services in your browser settings and try again.",
        locationUnavailable: "Your location could not be determined. Please enter your address manually.",
        locationTimeout: "Location request timed out. Please try again or enter your address manually.",
        locationNotSupported: "Location services are not supported by your browser. Please enter your address manually.",
        zoneChangeWarning: "Zone Change Warning",
        zoneChangeMessage: "Your new address is in a different delivery zone. Some items in your cart may not be available in this zone and will be removed.",
        proceedWithChange: "Proceed",
        cancelChange: "Cancel",
    },
    fr: {
        brandName: "ShopEverywhere",
        searchPlaceholder: "Rechercher des produits...",
        filterStore: "Filtrer par magasin",
        selectAll: "Tout sélectionner",
        signIn: "Se connecter",
        signUp: "S'inscrire",
        signOut: "Se déconnecter",
        myDetails: "Mes détails",
        previousOrders: "Commandes précédentes",
        categories: "Catégories",
        clear: "Effacer",
        whereAreYouShopping: "Où faites-vous vos achats ?",
        setLocationMessage: "Définissez votre emplacement pour trouver des offres près de chez vous.",
        setLocationButton: "Définir l'emplacement",
        outsideAreaTitle: "Hors zone de service",
        outsideAreaMessage: "Désolé, nous n'opérons pas actuellement dans votre zone.",
        noProducts: "Aucun produit trouvé.",
        loading: "Chargement...",
        loadMore: "Charger plus",
        from: "À partir de",
        footerRights: "ShopEverywhere. Tous droits réservés.",
        cartEmpty: "Votre panier est vide",
        cartTitle: "Panier",
        addToCart: "Ajouter au panier",
        subtotal: "Sous-total",
        checkout: "Paiement",
        menu: "Menu",
        selectLocationTitle: "Sélectionner l'emplacement",
        enterAddressPlaceholder: "Entrez votre adresse...",
        searchButton: "Rechercher",
        googleMapWidget: "Widget Google Map",
        useMockLocation: "Utiliser l'emplacement fictif de Montréal",
        useCurrentLocation: "Utiliser ma localisation",
        save: "Enregistrer",
        cancel: "Annuler",
        fullName: "Nom complet",
        email: "Courriel",
        shippingAddress: "Adresse de livraison",
        categoryLabel: "Catégorie",
        uncategorized: "Non classé",
        city: "Ville",
        state: "Province / État",
        country: "Pays",
        postalCode: "Code postal",
        needLocationTitle: "Magasinez partout, commencez par votre adresse",
        guestLocationMessage: "Entrez votre adresse pour commencer vos achats, ou",
        authLocationMessage: "Ajoutez votre adresse de livraison pour continuer.",
        enterAddressCta: "Entrer l'adresse",
        pickLocationCta: "Choisir un lieu",
        changeLocation: "Changer d'emplacement",
        locationSaved: "Adresse enregistrée! Nous affichons les magasins près de vous.",
        locationRemovedItems: "Nous avons retiré {count} article(s) indisponibles dans cette zone.",
        locationMissing: "Nous n'avons pas trouvé de zone de service pour cette adresse. Réessayez.",
        locationPermissionDenied: "L'accès à la localisation a été refusé. Veuillez activer les services de localisation dans les paramètres de votre navigateur.",
        locationUnavailable: "Votre position n'a pas pu être déterminée. Veuillez entrer votre adresse manuellement.",
        locationTimeout: "La demande de localisation a expiré. Réessayez ou entrez votre adresse manuellement.",
        locationNotSupported: "Les services de localisation ne sont pas pris en charge par votre navigateur. Veuillez entrer votre adresse manuellement.",
        zoneChangeWarning: "Changement de zone",
        zoneChangeMessage: "Votre nouvelle adresse est dans une zone de livraison différente. Certains articles de votre panier pourraient ne pas être disponibles dans cette zone et seront retirés.",
        proceedWithChange: "Continuer",
        cancelChange: "Annuler",
    },
    es: {
        brandName: "ShopEverywhere",
        searchPlaceholder: "Buscar productos...",
        filterStore: "Filtrar por tienda",
        selectAll: "Seleccionar todo",
        signIn: "Iniciar sesión",
        signUp: "Registrarse",
        signOut: "Cerrar sesión",
        myDetails: "Mis detalles",
        previousOrders: "Pedidos anteriores",
        categories: "Categorías",
        clear: "Borrar",
        whereAreYouShopping: "¿Dónde estás comprando?",
        setLocationMessage: "Establece tu ubicación para encontrar ofertas cerca de ti.",
        setLocationButton: "Establecer ubicación",
        outsideAreaTitle: "Fuera del área de servicio",
        outsideAreaMessage: "Lo sentimos, actualmente no operamos en tu zona.",
        noProducts: "No se encontraron productos.",
        loading: "Cargando...",
        loadMore: "Cargar más",
        from: "Desde",
        footerRights: "ShopEverywhere. Todos los derechos reservados.",
        cartEmpty: "Tu carrito está vacío",
        cartTitle: "Carrito de compras",
        addToCart: "Añadir al carrito",
        subtotal: "Subtotal",
        checkout: "Pagar",
        menu: "Menú",
        selectLocationTitle: "Seleccionar ubicación",
        enterAddressPlaceholder: "Ingresa tu dirección...",
        searchButton: "Buscar",
        googleMapWidget: "Widget de Google Map",
        useMockLocation: "Usar ubicación simulada de Montreal",
        useCurrentLocation: "Usar mi ubicación actual",
        save: "Guardar",
        cancel: "Cancelar",
        fullName: "Nombre completo",
        email: "Correo electrónico",
        shippingAddress: "Dirección de envío",
        categoryLabel: "Categoría",
        uncategorized: "Sin categoría",
        city: "Ciudad",
        state: "Estado / Provincia",
        country: "País",
        postalCode: "Código postal",
        needLocationTitle: "Compra en todas partes comenzando con tu dirección",
        guestLocationMessage: "Ingresa tu dirección para comenzar a comprar o",
        authLocationMessage: "Agrega tu dirección de entrega para continuar.",
        enterAddressCta: "Ingresar dirección",
        pickLocationCta: "Elegir ubicación",
        changeLocation: "Cambiar ubicación",
        locationSaved: "Dirección guardada. Mostramos tiendas cercanas.",
        locationRemovedItems: "Quitamos {count} artículo(s) no disponibles en esta zona.",
        locationMissing: "No encontramos una zona para esa dirección. Intenta de nuevo.",
        locationPermissionDenied: "Se denegó el acceso a la ubicación. Habilita los servicios de ubicación en la configuración de tu navegador.",
        locationUnavailable: "No se pudo determinar tu ubicación. Ingresa tu dirección manualmente.",
        locationTimeout: "La solicitud de ubicación expiró. Intenta de nuevo o ingresa tu dirección manualmente.",
        locationNotSupported: "Los servicios de ubicación no son compatibles con tu navegador. Ingresa tu dirección manualmente.",
        zoneChangeWarning: "Cambio de zona",
        zoneChangeMessage: "Tu nueva dirección está en una zona de entrega diferente. Algunos artículos de tu carrito podrían no estar disponibles en esta zona y serán eliminados.",
        proceedWithChange: "Continuar",
        cancelChange: "Cancelar",
    }
};

// --- Components ---

const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
    >
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="h-5 w-5 text-slate-500" />
                </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    </div>
);

const Drawer = ({ title, children, onClose, isOpen, side = "right" }: { title: string, children: React.ReactNode, onClose: () => void, isOpen: boolean, side?: "left" | "right" }) => {
    const isLeft = side === "left";
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
                    onClick={onClose}
                />
            )}
            <div
                className={`fixed inset-y-0 ${isLeft ? 'left-0' : 'right-0'} w-full sm:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
                    isOpen
                        ? 'translate-x-0'
                        : isLeft ? '-translate-x-full' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

const CategoryItem = ({
    category,
    selectedCategory,
    onSelect,
    locale,
}: {
    category: Category;
    selectedCategory: string | null;
    onSelect: (id: string) => void;
    locale: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = category.children && category.children.length > 0;
    const label = getLocalizedName(category.nameTranslations, locale);

    const isChildSelected = (cat: Category): boolean => {
        if (cat.id === selectedCategory) return true;
        if (cat.children) {
            return cat.children.some(child => isChildSelected(child));
        }
        return false;
    };

    useEffect(() => {
        if (hasChildren && isChildSelected(category)) {
            setIsOpen(true);
        }
    }, [selectedCategory, category, hasChildren]);
    
    return (
        <div className="ml-1">
            <div className={`flex items-center py-2 px-2 cursor-pointer rounded-lg transition-colors ${selectedCategory === category.id ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50 text-slate-600 hover:text-slate-800"}`}>
                {hasChildren && (
                    <span 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setIsOpen(!isOpen); 
                        }} 
                        className="mr-1.5 p-1 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                <span
                    className={`${selectedCategory === category.id ? "font-semibold" : ""} flex-1 text-sm`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(category.id);
                    }}
                >
                    {label}
                </span>
            </div>
            {isOpen && hasChildren && (
                <div className="ml-3 border-l-2 border-slate-100 pl-2">
                    {category.children!.map(child => (
                        <CategoryItem 
                            key={child.id} 
                            category={child} 
                            selectedCategory={selectedCategory}
                            onSelect={onSelect}
                            locale={locale}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


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
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(true); // Desktop default
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [geolocationAvailable, setGeolocationAvailable] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productQuantity, setProductQuantity] = useState(1);
    const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartLoading, setCartLoading] = useState(true);
    const [cartDataLoaded, setCartDataLoaded] = useState(false);
    const [profileDataLoaded, setProfileDataLoaded] = useState(false);
    const [addressLoadedFromBackend, setAddressLoadedFromBackend] = useState(false);
    const cartFetchedRef = useRef(false);
    const profileFetchedRef = useRef(false);
    
    // Location
    const [, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [zoneInfo, setZoneInfo] = useState<{inZone: boolean, zoneId?: string, zoneName?: string} | null>(null);
    const [addressDetails, setAddressDetails] = useState<LocationDetails | null>(null);
    const [cartId, setCartId] = useState<string | null>(null);
    const [locationNotice, setLocationNotice] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);
    const [autoLocationRequested, setAutoLocationRequested] = useState(false);
    const [addressForm, setAddressForm] = useState({ address: "", city: "", state: "", postalCode: "", country: "" });
    const [resolvingLocation, setResolvingLocation] = useState(false);
    const [isManualLocationChange, setIsManualLocationChange] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 45.5017, lng: -73.5673 });
    const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
    const [showZoneChangeWarning, setShowZoneChangeWarning] = useState(false);
    const [pendingLocationData, setPendingLocationData] = useState<{
        payload: LocationPayload;
        newZone: { inZone: boolean; zoneId?: string; zoneName?: string };
        location: LocationDetails;
    } | null>(null);
    
    // Locale
    const [locale, setLocale] = useState("en");

    // Helper for translations
    const t = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;

    // Extract unique stores from products
    const uniqueStores = useMemo(() => {
        const storeMap = new Map<string, { id: string; name: string }>();
        products.forEach(product => {
            if (product.storeId && product.ownerStoreName) {
                storeMap.set(product.storeId, { id: product.storeId, name: product.ownerStoreName });
            }
        });
        return Array.from(storeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [products]);

    // Filter products by selected stores (in-memory filtering)
    const filteredProducts = useMemo(() => {
        if (selectedStoreIds.size === 0) {
            return products; // No filter applied, show all
        }
        return products.filter(product => product.storeId && selectedStoreIds.has(product.storeId));
    }, [products, selectedStoreIds]);

    // Toggle store selection (in pending state)
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

    // Select/deselect all stores (in pending state)
    const toggleAllStores = () => {
        if (pendingStoreIds.size === uniqueStores.length) {
            setPendingStoreIds(new Set());
        } else {
            setPendingStoreIds(new Set(uniqueStores.map(s => s.id)));
        }
    };

    // Apply pending filters
    const applyStoreFilter = () => {
        setSelectedStoreIds(new Set(pendingStoreIds));
        setShowAdvancedSearch(false);
    };

    // Clear all filters
    const clearStoreFilter = () => {
        setPendingStoreIds(new Set());
    };

    // Open filter panel - sync pending with current
    const openFilterPanel = () => {
        setPendingStoreIds(new Set(selectedStoreIds));
        setShowAdvancedSearch(true);
    };

    // Open location modal with pre-populated data
    const openLocationModal = useCallback(() => {
        // Pre-populate form with current address
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

    // Fetch cart from backend
    const fetchCart = useCallback(async (existingCartId?: string | null, skipIfFetched = false) => {
        if (skipIfFetched && cartFetchedRef.current) return;
        cartFetchedRef.current = true;
        setCartLoading(true);
        try {
            const params = existingCartId ? `?cartId=${existingCartId}` : '';
            const res = await fetch(`/api/cart${params}`);
            if (!res.ok) throw new Error("Failed to fetch cart");
            const data = await res.json();
            
            if (data.cartId) {
                setCartId(data.cartId);
                localStorage.setItem("se_cart_id", data.cartId);
            }
            
            if (data.items && Array.isArray(data.items)) {
                setCartItems(data.items.map((item: any) => ({
                    product: item.product,
                    quantity: item.quantity,
                })));
            }
            
            // If cart has location data, ALWAYS use it (this is the source of truth)
            if (data.latitude && data.longitude && data.address) {
                const cartLocation = {
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    postalCode: data.postalCode,
                    latitude: data.latitude,
                    longitude: data.longitude,
                };
                setAddressDetails(cartLocation);
                setUserLocation({ lat: data.latitude, lng: data.longitude });
                setMapMarker({ lat: data.latitude, lng: data.longitude });
                setMapCenter({ lat: data.latitude, lng: data.longitude });
                // Mark that we loaded address from backend
                setAddressLoadedFromBackend(true);
                setAutoLocationRequested(true);
                if (data.zoneId) {
                    setZoneInfo({ inZone: true, zoneId: data.zoneId });
                }
                // Store in localStorage as backup
                localStorage.setItem("se_location", JSON.stringify({ 
                    location: cartLocation, 
                    zone: data.zoneId ? { inZone: true, zoneId: data.zoneId } : null 
                }));
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        } finally {
            setCartLoading(false);
            setCartDataLoaded(true);
        }
    }, []);

    // Sync cart item to backend
    const syncCartAdd = useCallback(async (product: Product, quantity: number = 1) => {
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartId,
                    productId: product.id,
                    quantity,
                }),
            });
            const data = await res.json();
            if (data.cartId && !cartId) {
                setCartId(data.cartId);
                localStorage.setItem("se_cart_id", data.cartId);
            }
        } catch (error) {
            console.error("Error syncing cart:", error);
        }
    }, [cartId]);

    const syncCartUpdate = useCallback(async (productId: string, quantity: number) => {
        try {
            await fetch("/api/cart", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartId,
                    productId,
                    quantity,
                }),
            });
        } catch (error) {
            console.error("Error updating cart:", error);
        }
    }, [cartId]);

    const syncCartRemove = useCallback(async (productId: string) => {
        try {
            await fetch(`/api/cart?cartId=${cartId}&productId=${productId}`, {
                method: "DELETE",
            });
        } catch (error) {
            console.error("Error removing from cart:", error);
        }
    }, [cartId]);

    // Init
    useEffect(() => {
        fetchCategories();
        if (typeof window !== "undefined") {
            // Check if geolocation is available (requires secure context - HTTPS or localhost)
            const isSecure = window.isSecureContext === true;
            const hasGeolocation = !!window.navigator?.geolocation;
            setGeolocationAvailable(isSecure && hasGeolocation);
            
            const savedLocale = localStorage.getItem("locale");
            if (savedLocale) setLocale(savedLocale);
            else if (window.navigator?.language) setLocale(window.navigator.language.split("-")[0] || "en");

            const storedLocation = localStorage.getItem("se_location");
            if (storedLocation) {
                try {
                    const parsed = JSON.parse(storedLocation);
                    if (parsed?.location) {
                        setAddressDetails(parsed.location);
                        if (parsed.location.latitude && parsed.location.longitude) {
                            setUserLocation({ lat: parsed.location.latitude, lng: parsed.location.longitude });
                            setMapMarker({ lat: parsed.location.latitude, lng: parsed.location.longitude });
                            setMapCenter({ lat: parsed.location.latitude, lng: parsed.location.longitude });
                        }
                    }
                    if (parsed?.zone) {
                        setZoneInfo(parsed.zone);
                    }
                } catch (e) {
                    console.warn("Unable to parse saved location", e);
                }
            }

            const storedCart = localStorage.getItem("se_cart_id");
            if (storedCart) setCartId(storedCart);
            
            // Fetch cart from backend (only once)
            fetchCart(storedCart, true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!session?.user) {
            profileFetchedRef.current = false;
            // For non-logged-in users, mark profile as "loaded" (nothing to load)
            setProfileDataLoaded(true);
            return;
        }
        if (profileFetchedRef.current) return;
        profileFetchedRef.current = true;
        
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (!res.ok) {
                    setProfileDataLoaded(true);
                    return;
                }
                const data = await res.json();
                if (data?.cartId) {
                    setCartId(data.cartId);
                    if (typeof window !== "undefined") {
                        localStorage.setItem("se_cart_id", data.cartId);
                    }
                }
                if (data?.zone) {
                    setZoneInfo(data.zone);
                }
                if (data?.user) {
                    const profileLocation: LocationDetails = {
                        address: data.user.address,
                        city: data.user.city,
                        state: data.user.state,
                        country: data.user.country,
                        postalCode: data.user.postalCode,
                        latitude: data.user.latitude,
                        longitude: data.user.longitude,
                    };
                    const hasLocation = profileLocation.address && profileLocation.latitude && profileLocation.longitude;
                    if (hasLocation) {
                        setAddressDetails(profileLocation);
                        setAddressLoadedFromBackend(true); // Mark address loaded from backend
                        setAutoLocationRequested(true); // Prevent auto-detection from overriding
                        if (profileLocation.latitude && profileLocation.longitude) {
                            setUserLocation({ lat: profileLocation.latitude, lng: profileLocation.longitude });
                            setMapMarker({ lat: profileLocation.latitude, lng: profileLocation.longitude });
                            setMapCenter({ lat: profileLocation.latitude, lng: profileLocation.longitude });
                        }
                        if (typeof window !== "undefined") {
                            localStorage.setItem("se_location", JSON.stringify({ location: profileLocation, zone: data.zone || null }));
                        }
                    }
                }
                // Fetch cart items for logged in user
                cartFetchedRef.current = false; // Reset to allow fetching with user's cart
                setCartDataLoaded(false); // Reset cart loaded state
                fetchCart(data?.cartId);
            } catch (error) {
                console.error(error);
            } finally {
                setProfileDataLoaded(true);
            }
        };

        fetchProfile();
    }, [session, fetchCart]);

    // Product Fetching
    useEffect(() => {
        if (zoneInfo?.zoneId && zoneInfo.inZone) {
            fetchProducts();
        } else {
            setProducts([]);
            setHasMore(false);
        }
    }, [zoneInfo, selectedCategory, debouncedSearchQuery, page]);

    // Debounce search query - only update after 500ms of no typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(1); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            if (!res.ok) {
                console.error("Failed to fetch categories", res.status);
                setCategories([]);
                return;
            }
            const data = await res.json().catch(() => null);
            if (data && Array.isArray(data.categories)) {
                setCategories(data.categories);
            } else {
                setCategories([]);
            }
        } catch (e) { 
            console.error(e); 
            setCategories([]);
        }
    };

    const fetchProducts = async () => {
        if (!zoneInfo?.zoneId || !zoneInfo.inZone) {
            setHasMore(false);
            setProducts([]);
            return;
        }
        setLoadingProducts(true);
        try {
            const params = new URLSearchParams({
                zoneId: zoneInfo.zoneId,
                page: page.toString(),
                q: debouncedSearchQuery
            });
            if (selectedCategory) params.append("categoryId", selectedCategory);
            
            const res = await fetch(`/api/products?${params}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            
            if (page === 1) setProducts(data.products);
            else setProducts(prev => [...prev, ...data.products]);
            
            setHasMore(page < data.totalPages);
        } catch (e) { console.error(e); }
        finally { setLoadingProducts(false); }
    };

    // Check zone and optionally persist location
    const checkAndUpdateLocation = useCallback(async (payload: LocationPayload, manual = false) => {
        const translate = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;
        setResolvingLocation(true);
        
        try {
            // First, check what zone the new location is in
            const checkRes = await fetch("/api/location/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, cartId }),
            });
            
            const checkData = await checkRes.json();
            
            if (!checkRes.ok || !checkData) {
                if (manual) {
                    setLocationNotice({ type: "error", message: checkData?.error || translate('locationMissing') });
                }
                setResolvingLocation(false);
                return;
            }

            // If zone changed and this is manual, show warning
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

            // No zone change or not manual, proceed with persist
            await persistLocation(payload, manual);
        } catch (error) {
            console.error(error);
            if (manual) {
                setLocationNotice({ type: "error", message: translations[locale]?.['locationMissing'] || translations['en']['locationMissing'] });
            }
            setResolvingLocation(false);
        }
    }, [cartId, locale]);

    // Actually persist the location to backend
    const persistLocation = useCallback(async (payload: LocationPayload, manual = false) => {
        const translate = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;
        setResolvingLocation(true);
        if (manual) {
            setLocationNotice(null);
        }
        try {
            const res = await fetch("/api/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, cartId }),
            });
            let data: any = null;
            try {
                data = await res.json();
            } catch (parseError) {
                data = null;
            }
            if (!res.ok || !data) {
                if (manual) {
                    setLocationNotice({ type: "error", message: data?.error || translate('locationMissing') });
                }
                return;
            }
            if (data.cartId) {
                setCartId(data.cartId);
                if (typeof window !== "undefined") {
                    localStorage.setItem("se_cart_id", data.cartId);
                }
            }
            if (data.location) {
                setAddressDetails(data.location);
                if (data.location.latitude && data.location.longitude) {
                    setUserLocation({ lat: data.location.latitude, lng: data.location.longitude });
                    setMapMarker({ lat: data.location.latitude, lng: data.location.longitude });
                    setMapCenter({ lat: data.location.latitude, lng: data.location.longitude });
                }
            }
            setZoneInfo(data.zone || null);
            if (typeof window !== "undefined") {
                localStorage.setItem("se_location", JSON.stringify({ location: data.location, zone: data.zone || null }));
            }
            
            // Refresh cart from backend to reflect any removed items
            if (data.removedItems > 0 || data.zone?.zoneId) {
                cartFetchedRef.current = false;
                await fetchCart(data.cartId);
            }
            
            // Only show notice for manual location changes
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
    }, [cartId, locale, fetchCart]);

    // Handle zone change confirmation
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

    // Helper to get location error message based on error code
    const getLocationErrorMessage = (error: GeolocationPositionError | null | undefined) => {
        const tLocal = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;
        if (!error) {
            return tLocal('locationUnavailable');
        }
        try {
            switch (error.code) {
                case 1: // PERMISSION_DENIED
                    return tLocal('locationPermissionDenied');
                case 2: // POSITION_UNAVAILABLE
                    return tLocal('locationUnavailable');
                case 3: // TIMEOUT
                    return tLocal('locationTimeout');
                default:
                    return tLocal('locationUnavailable');
            }
        } catch {
            return tLocal('locationUnavailable');
        }
    };

    // Safe console logger
    const safeLog = (...args: unknown[]) => {
        try {
            if (typeof console !== 'undefined' && typeof console.error === 'function') {
                console.error(...args);
            }
        } catch {
            // Ignore console errors
        }
    };

    // Just populate fields without saving (for modal use)
    const handleUseCurrentLocationForFields = () => {
        try {
            if (typeof window === "undefined" || !window.navigator?.geolocation) {
                setLocationNotice({ type: "error", message: translations[locale]?.['locationNotSupported'] || translations['en']['locationNotSupported'] });
                return;
            }
            
            // Show loading state
            setResolvingLocation(true);
            
            window.navigator.geolocation.getCurrentPosition(
                (pos) => {
                    try {
                        const lat = pos?.coords?.latitude;
                        const lng = pos?.coords?.longitude;
                        
                        if (typeof lat !== 'number' || typeof lng !== 'number') {
                            setResolvingLocation(false);
                            setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
                            return;
                        }
                        
                        setMapMarker({ lat, lng });
                        setMapCenter({ lat, lng });
                        
                        // Reverse geocode to fill address fields
                        if (typeof google !== "undefined" && google?.maps?.Geocoder) {
                            const geocoder = new google.maps.Geocoder();
                            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                                try {
                                    setResolvingLocation(false);
                                    if (status === "OK" && results?.[0]) {
                                        const result = results[0];
                                        const getComponent = (type: string) =>
                                            result.address_components?.find((c) => c.types?.includes(type))?.long_name || "";
                                        setAddressForm({
                                            address: result.formatted_address?.split(",")[0] || "",
                                            city: getComponent("locality") || getComponent("sublocality") || getComponent("administrative_area_level_2"),
                                            state: getComponent("administrative_area_level_1"),
                                            postalCode: getComponent("postal_code"),
                                            country: getComponent("country"),
                                        });
                                    }
                                } catch (geocodeErr) {
                                    setResolvingLocation(false);
                                    safeLog("Geocode callback error:", geocodeErr);
                                }
                            });
                        } else {
                            setResolvingLocation(false);
                        }
                    } catch (successErr) {
                        setResolvingLocation(false);
                        safeLog("Geolocation success callback error:", successErr);
                        setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
                    }
                },
                (error) => {
                    try {
                        setResolvingLocation(false);
                        safeLog("Geolocation error:", error?.code, error?.message);
                        setLocationNotice({ type: "error", message: getLocationErrorMessage(error) });
                    } catch {
                        setResolvingLocation(false);
                        setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 15000,
                    maximumAge: 60000
                }
            );
        } catch (outerErr) {
            setResolvingLocation(false);
            safeLog("handleUseCurrentLocationForFields error:", outerErr);
            setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
        }
    };

    // Auto-detect location and save (for initial load)
    const handleUseCurrentLocation = (manual = true) => {
        try {
            if (typeof window === "undefined" || !window.navigator?.geolocation) {
                if (manual) {
                    setLocationNotice({ type: "error", message: translations[locale]?.['locationNotSupported'] || translations['en']['locationNotSupported'] });
                }
                return;
            }
            window.navigator.geolocation.getCurrentPosition(
                (pos) => {
                    try {
                        const lat = pos?.coords?.latitude;
                        const lng = pos?.coords?.longitude;
                        if (typeof lat === 'number' && typeof lng === 'number') {
                            checkAndUpdateLocation({ lat, lng }, manual);
                        } else if (manual) {
                            setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
                        }
                    } catch (successErr) {
                        safeLog("Geolocation success callback error:", successErr);
                        if (manual) {
                            setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
                        }
                    }
                },
                (error) => {
                    try {
                        safeLog("Geolocation error:", error?.code, error?.message);
                        if (manual) {
                            setLocationNotice({ type: "error", message: getLocationErrorMessage(error) });
                        }
                    } catch {
                        if (manual) {
                            setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
                        }
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 15000,
                    maximumAge: 60000
                }
            );
        } catch (outerErr) {
            safeLog("handleUseCurrentLocation error:", outerErr);
            if (manual) {
                setLocationNotice({ type: "error", message: translations[locale]?.['locationUnavailable'] || translations['en']['locationUnavailable'] });
            }
        }
    };

    // Debounced geocoding for address fields
    const geocodeAddressDebounced = useCallback(() => {
        if (!addressForm.address && !addressForm.city && !addressForm.country) return;
        if (typeof google === "undefined") return;
        
        const geocoder = new google.maps.Geocoder();
        const addressString = [addressForm.address, addressForm.city, addressForm.state, addressForm.postalCode, addressForm.country]
            .filter(Boolean)
            .join(", ");
        
        if (!addressString.trim()) return;
        
        geocoder.geocode({ address: addressString }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const location = results[0].geometry.location;
                setMapMarker({ lat: location.lat(), lng: location.lng() });
                setMapCenter({ lat: location.lat(), lng: location.lng() });
            }
        });
    }, [addressForm]);

    // Debounce effect for geocoding
    useEffect(() => {
        const timer = setTimeout(() => {
            if (showLocationModal && mapsLoaded) {
                geocodeAddressDebounced();
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [addressForm, showLocationModal, mapsLoaded, geocodeAddressDebounced]);

    // Auto-detect location ONLY if:
    // 1. Geolocation is available (secure context)
    // 2. Both cart AND profile data have been loaded from backend
    // 3. No address was loaded from backend (cart or profile)
    // 4. We haven't already requested auto-location
    useEffect(() => {
        // Don't attempt if geolocation is not available (not secure context)
        if (!geolocationAvailable) return;
        
        // Wait for BOTH cart and profile to be fully loaded
        if (!cartDataLoaded || !profileDataLoaded) return;
        
        // Don't run if we already loaded an address from backend
        if (addressLoadedFromBackend) return;
        
        // Don't run if we already have an address or already requested
        if (addressDetails || autoLocationRequested) return;
        
        if (typeof window === "undefined" || !window.navigator?.geolocation) return;
        
        setAutoLocationRequested(true);
        window.navigator.geolocation.getCurrentPosition(
            (pos) => {
                try {
                    const lat = pos?.coords?.latitude;
                    const lng = pos?.coords?.longitude;
                    if (typeof lat === 'number' && typeof lng === 'number') {
                        checkAndUpdateLocation({ lat, lng }, false);
                    }
                } catch {
                    // Silently fail for auto-detection
                }
            },
            () => {
                // Silently fail for auto-detection (user denied or unavailable)
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }, [geolocationAvailable, cartDataLoaded, profileDataLoaded, addressLoadedFromBackend, addressDetails, autoLocationRequested, checkAndUpdateLocation]);

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
                        <div className="hidden md:flex flex-1 max-w-2xl items-center gap-2 relative">
                            <div className="relative flex-1 group">
                                <input 
                                    type="text" 
                                    placeholder={t('searchPlaceholder')}
                                    className="w-full pl-11 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:outline-none transition-all duration-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-4 top-3 text-white/50 group-focus-within:text-slate-400 h-5 w-5 transition-colors" />
                            </div>
                            <div className="relative">
                                <button 
                                    onClick={openFilterPanel}
                                    className={`p-2.5 rounded-xl transition-colors ${
                                        selectedStoreIds.size > 0 
                                            ? 'bg-amber-500 text-white' 
                                            : 'hover:bg-white/10 text-white/70 hover:text-white'
                                    }`}
                                    title={t('filterStore')}
                                >
                                    <Filter size={20} />
                                    {selectedStoreIds.size > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {selectedStoreIds.size}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

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

                            {session?.user && (session.user as any).isAdmin && (
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

                {/* Mobile Search (sticky with nav) */}
                <div className="md:hidden p-3 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder={t('searchPlaceholder')}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3 text-white/50 h-5 w-5" />
                        </div>
                        {/* Mobile Filter Button */}
                        <button 
                            onClick={openFilterPanel}
                            className={`relative p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                                selectedStoreIds.size > 0 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                            }`}
                            title={t('filterStore')}
                        >
                            <Filter size={20} />
                            {selectedStoreIds.size > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {selectedStoreIds.size}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 container mx-auto px-4 py-8 flex gap-8">
                {/* Sidebar - Categories (Desktop) */}
                <aside className={`hidden lg:block w-72 flex-shrink-0 transition-all ${isCategoriesOpen ? '' : '-ml-72'}`}>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 sticky top-24">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 text-lg">{t('categories')}</h3>
                            <button onClick={() => { setSelectedCategory(null); setPage(1); }} className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">{t('clear')}</button>
                        </div>
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <CategoryItem 
                                    key={cat.id} 
                                    category={cat} 
                                    selectedCategory={selectedCategory} 
                                    onSelect={(id) => {
                                        setSelectedCategory(id);
                                        setPage(1);
                                    }}
                                    locale={locale}
                                />
                            ))}
                        </div>
                    </div>
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
                                <X size={18} />
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
                        <>
                             {/* Products Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                                        <div 
                                            className="relative h-52 cursor-pointer overflow-hidden"
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setProductQuantity(1);
                                                setShowProductModal(true);
                                            }}
                                        >
                                            <Image src={product.imageUrl || "https://placehold.co/200"} alt={getLocalizedName(product.nameTranslations, locale, product.name)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 
                                                    className="font-bold text-slate-800 leading-tight line-clamp-2 cursor-pointer hover:text-amber-600 transition-colors"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setProductQuantity(1);
                                                        setShowProductModal(true);
                                                    }}
                                                >
                                                    {getLocalizedName(product.nameTranslations, locale, product.name)}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1">
                                                <Building2 size={12} />
                                                <span className="font-medium">{product.ownerStoreName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                                                <FolderTree size={12} />
                                                <span>{getLocalizedName(product.categoryTranslations, locale, t('uncategorized'))}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-500 line-clamp-2">
                                                    {getLocalizedName(product.shortDescriptionTranslations, locale, product.description)}
                                                </p>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('from')}</p>
                                                    <p className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">${Number(product.minPrice).toFixed(2)}</p>
                                                </div>
                                                <button 
                                                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setProductQuantity(1);
                                                        setShowProductModal(true);
                                                    }}
                                                >
                                                    <ShoppingCart size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {products.length === 0 && !loadingProducts && (
                                <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200/60">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                                        <Search className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 text-lg">{t('noProducts')}</p>
                                </div>
                            )}

                            {loadingProducts && (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-sm border border-slate-200/60">
                                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-slate-600 font-medium">{t('loading')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Pagination / Load More */}
                            {hasMore && !loadingProducts && products.length > 0 && (
                                <div className="mt-12 text-center">
                                    <button onClick={() => setPage(p => p + 1)} className="px-8 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-600 shadow-lg hover:shadow-xl transition-all">
                                        {t('loadMore')}
                                    </button>
                                </div>
                            )}
                        </>
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
            <Drawer title={t('cartTitle')} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}>
                {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-5">
                            <ShoppingCart size={40} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">{t('cartEmpty')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4 overflow-y-auto">
                            {cartItems.map((item) => (
                                <div key={item.product.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                        <Image
                                            src={item.product.imageUrl || "https://placehold.co/100"}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{item.product.name}</h4>
                                        <p className="text-xs text-amber-600 font-medium">{item.product.ownerStoreName}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="font-bold text-slate-800">${Number(item.product.minPrice).toFixed(2)}</p>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        const newQty = Math.max(1, item.quantity - 1);
                                                        syncCartUpdate(item.product.id, newQty);
                                                        setCartItems(prev =>
                                                            prev.map(i =>
                                                                i.product.id === item.product.id
                                                                    ? { ...i, quantity: newQty }
                                                                    : i
                                                            )
                                                        );
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-semibold text-slate-700">{item.quantity}</span>
                                                <button
                                                    onClick={() => {
                                                        const newQty = item.quantity + 1;
                                                        syncCartUpdate(item.product.id, newQty);
                                                        setCartItems(prev =>
                                                            prev.map(i =>
                                                                i.product.id === item.product.id
                                                                    ? { ...i, quantity: newQty }
                                                                    : i
                                                            )
                                                        );
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        syncCartRemove(item.product.id);
                                                        setCartItems(prev => prev.filter(i => i.product.id !== item.product.id));
                                                    }}
                                                    className="ml-2 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 pt-5 mt-4">
                            {(() => {
                                const subtotal = cartItems.reduce((sum, item) => sum + item.product.minPrice * item.quantity, 0);
                                const gst = subtotal * 0.05;
                                const qst = subtotal * 0.09975;
                                const total = subtotal + gst + qst;
                                return (
                                    <div className="space-y-3 text-sm mb-5 bg-slate-50 rounded-xl p-4">
                                        <div className="flex justify-between text-slate-600">
                                            <span>{t('subtotal') || 'Subtotal'}</span>
                                            <span className="font-medium">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>GST (5%)</span>
                                            <span>${gst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>QST (9.975%)</span>
                                            <span>${qst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-200">
                                            <span className="text-slate-800">Total</span>
                                            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                            <button 
                                onClick={() => {
                                    // Save cart to localStorage for checkout page
                                    localStorage.setItem("se_checkout_cart", JSON.stringify(cartItems));
                                    setIsCartOpen(false);
                                    window.location.href = "/checkout";
                                }}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all"
                            >
                                {t('checkout') || 'Checkout'}
                            </button>
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Advanced Search / Store Filter Panel */}
            {showAdvancedSearch && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowAdvancedSearch(false)}
                    />
                    {/* Panel */}
                    <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                    <Filter className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t('filterStore')}</h3>
                            </div>
                            <button 
                                onClick={() => setShowAdvancedSearch(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-5">
                            {uniqueStores.length === 0 ? (
                                <div className="text-center py-8">
                                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">No stores available</p>
                                </div>
                            ) : (
                                <>
                                    {/* Select All */}
                                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border-b border-slate-100 mb-2">
                                        <input 
                                            type="checkbox" 
                                            checked={pendingStoreIds.size === uniqueStores.length && uniqueStores.length > 0}
                                            onChange={toggleAllStores}
                                            className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400" 
                                        />
                                        <span className="font-semibold text-slate-800">{t('selectAll')}</span>
                                        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {uniqueStores.length} stores
                                        </span>
                                    </label>
                                    
                                    {/* Store List */}
                                    <div className="space-y-1 max-h-64 overflow-y-auto">
                                        {uniqueStores.map(store => (
                                            <label 
                                                key={store.id} 
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={pendingStoreIds.has(store.id)}
                                                    onChange={() => toggleStoreFilter(store.id)}
                                                    className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400" 
                                                />
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                <span className="text-slate-700">{store.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={clearStoreFilter}
                                disabled={pendingStoreIds.size === 0}
                                className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('clear')}
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-500">
                                    {pendingStoreIds.size > 0 
                                        ? `${pendingStoreIds.size} selected`
                                        : 'Showing all stores'
                                    }
                                </span>
                                <button
                                    onClick={applyStoreFilter}
                                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Modal */}
            {showLocationModal && (
                <Modal title={t('selectLocationTitle')} onClose={() => setShowLocationModal(false)}>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div className="grid gap-3">
                            <input
                                type="text"
                                placeholder={t('enterAddressPlaceholder')}
                                className="w-full rounded-md border px-4 py-2"
                                value={addressForm.address}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                                required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('city') || "City"}
                                    className="rounded-md border px-4 py-2"
                                    value={addressForm.city}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder={t('state') || "State / Province"}
                                    className="rounded-md border px-4 py-2"
                                    value={addressForm.state}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('postalCode') || "Postal Code"}
                                    className="rounded-md border px-4 py-2"
                                    value={addressForm.postalCode}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                                />
                                <input
                                    type="text"
                                    placeholder={t('country') || "Country"}
                                    className="rounded-md border px-4 py-2"
                                    value={addressForm.country}
                                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
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
                                            const lat = e.latLng.lat();
                                            const lng = e.latLng.lng();
                                            setMapMarker({ lat, lng });
                                            // Reverse geocode to fill address
                                            const geocoder = new google.maps.Geocoder();
                                            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                                                if (status === "OK" && results?.[0]) {
                                                    const result = results[0];
                                                    const getComponent = (type: string) =>
                                                        result.address_components.find((c) => c.types.includes(type))?.long_name || "";
                                                    setAddressForm({
                                                        address: result.formatted_address.split(",")[0] || "",
                                                        city: getComponent("locality") || getComponent("sublocality") || getComponent("administrative_area_level_2"),
                                                        state: getComponent("administrative_area_level_1"),
                                                        postalCode: getComponent("postal_code"),
                                                        country: getComponent("country"),
                                                    });
                                                }
                                            });
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
                                <button type="button" onClick={handleUseCurrentLocationForFields} className="rounded-md border border-indigo-200 px-4 py-2 text-indigo-600 hover:bg-indigo-50">
                                    {t('useCurrentLocation')}
                                </button>
                            )}
                            <div className="flex flex-wrap gap-3 items-center">
                                <button type="button" onClick={() => setShowLocationModal(false)} className="text-gray-600 hover:underline">
                                    {t('cancel')}
                                </button>
                                <button type="submit" disabled={resolvingLocation} className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:opacity-70">
                                    {resolvingLocation ? t('loading') : t('save')}
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Zone Change Warning Modal */}
            {showZoneChangeWarning && pendingLocationData && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Globe className="h-6 w-6 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">{t('zoneChangeWarning')}</h2>
                            </div>
                            <p className="text-slate-600 mb-6">{t('zoneChangeMessage')}</p>
                            {pendingLocationData.newZone.inZone && (
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">New Zone:</p>
                                    <p className="font-semibold text-slate-800">{pendingLocationData.newZone.zoneName}</p>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelZoneChange}
                                    className="flex-1 py-3 px-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    {t('cancelChange')}
                                </button>
                                <button
                                    onClick={handleConfirmZoneChange}
                                    disabled={resolvingLocation}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                                >
                                    {resolvingLocation ? t('loading') : t('proceedWithChange')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Categories Sidebar - opens from left */}
            <Drawer title={t('menu')} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} side="left">
                <div className="space-y-4">
                     <h3 className="font-bold">{t('categories')}</h3>
                     <div className="space-y-1">
                        {categories.map(cat => (
                            <CategoryItem 
                                key={cat.id} 
                                category={cat} 
                                selectedCategory={selectedCategory} 
                                onSelect={(id) => {
                                    setSelectedCategory(id);
                                    setPage(1);
                                    setIsMobileMenuOpen(false);
                                }}
                                locale={locale}
                            />
                        ))}
                    </div>
                </div>
            </Drawer>
            
            {showUserModal && (
                <Modal title={t('myDetails')} onClose={() => setShowUserModal(false)}>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">{t('fullName')}</label>
                            <input type="text" className="w-full mt-1 border rounded p-2" defaultValue={session?.user?.name || ""} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('email')}</label>
                            <input type="email" className="w-full mt-1 border rounded p-2" defaultValue={session?.user?.email || ""} disabled />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('shippingAddress')}</label>
                            <textarea className="w-full mt-1 border rounded p-2" rows={3}></textarea>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t('cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{t('save')}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {showOrdersModal && (
                <Modal title={t('previousOrders')} onClose={() => setShowOrdersModal(false)}>
                    <div className="space-y-2">
                        {/* Mock Orders Accordion */}
                        {[1, 2].map(i => (
                            <div key={i} className="border rounded p-3">
                                <div className="flex justify-between font-medium cursor-pointer">
                                    <span>Order #{1000 + i}</span>
                                    <span>$123.45</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Product Modal */}
            {showProductModal && selectedProduct && (
                <Modal title={getLocalizedName(selectedProduct.nameTranslations, locale, selectedProduct.name)} onClose={() => { setShowProductModal(false); setSelectedProduct(null); setProductQuantity(1); }}>
                    <div className="space-y-5">
                        <div className="relative h-72 w-full rounded-xl overflow-hidden bg-slate-100">
                            <Image
                                src={selectedProduct.imageUrl || "https://placehold.co/400"}
                                alt={getLocalizedName(selectedProduct.nameTranslations, locale, selectedProduct.name)}
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1.5">
                                    <Building2 size={12} />
                                    {selectedProduct.ownerStoreName}
                                </span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1.5">
                                    <FolderTree size={12} />
                                    {getLocalizedName(selectedProduct.categoryTranslations, locale, t('uncategorized'))}
                                </span>
                            </div>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                {getLocalizedName(selectedProduct.descriptionTranslations, locale, selectedProduct.description)}
                            </p>
                            
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-600">{t('quantity') || 'Quantity'}:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setProductQuantity(prev => Math.max(1, prev - 1))}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                        disabled={productQuantity <= 1}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-12 text-center font-semibold text-slate-800">{productQuantity}</span>
                                    <button
                                        onClick={() => setProductQuantity(prev => prev + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-stone-50 rounded-xl">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('from')}</p>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">${(Number(selectedProduct.minPrice) * productQuantity).toFixed(2)}</p>
                                    {productQuantity > 1 && (
                                        <p className="text-xs text-slate-400">${Number(selectedProduct.minPrice).toFixed(2)} × {productQuantity}</p>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        setAddingToCart(true);
                                        // Sync with backend
                                        await syncCartAdd(selectedProduct, productQuantity);
                                        // Add to local cart state
                                        setCartItems(prev => {
                                            const existing = prev.find(item => item.product.id === selectedProduct.id);
                                            if (existing) {
                                                return prev.map(item =>
                                                    item.product.id === selectedProduct.id
                                                        ? { ...item, quantity: item.quantity + productQuantity }
                                                        : item
                                                );
                                            }
                                            return [...prev, { product: selectedProduct, quantity: productQuantity }];
                                        });
                                        setAddingToCart(false);
                                        setShowProductModal(false);
                                        setSelectedProduct(null);
                                        setProductQuantity(1);
                                        setIsCartOpen(true);
                                    }}
                                    disabled={addingToCart}
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3.5 rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all font-semibold"
                                >
                                    <ShoppingCart size={20} />
                                    {addingToCart ? t('loading') : t('addToCart') || 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
