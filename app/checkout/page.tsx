"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, AlertTriangle, X, Copy, Check, Loader2 } from "lucide-react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";

// Tax rates for Quebec, Canada
const GST_RATE = 0.05; // 5% Federal GST
const QST_RATE = 0.09975; // 9.975% Quebec QST

interface CartItem {
    product: {
        id: string;
        name: string;
        description: string;
        imageUrl: string;
        minPrice: number;
        ownerStoreName: string;
        storeId?: string;
    };
    quantity: number;
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

interface ZoneInfo {
    inZone: boolean;
    zoneId?: string;
    zoneName?: string;
}

type CheckoutStep = "review" | "address" | "confirm" | "pending" | "complete";

const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing")[] = ["places", "drawing"];

const translations = {
    en: {
        checkout: "Checkout",
        orderSummary: "Order Summary",
        shippingAddress: "Shipping Address",
        changeAddress: "Change Address",
        subtotal: "Subtotal",
        gst: "GST (5%)",
        qst: "QST (9.975%)",
        total: "Total",
        confirmOrder: "Confirm Order",
        backToCart: "Back to Cart",
        emptyCart: "Your cart is empty",
        goShopping: "Go Shopping",
        addressChangeWarning: "Zone Change Warning",
        addressChangeMessage: "The new address is in a different shipping zone. Some items may not be available for delivery to this address and will be removed from your cart.",
        proceed: "Proceed Anyway",
        cancel: "Cancel",
        eTransferInstructions: "E-Transfer Instructions",
        eTransferMessage: "Please send an e-transfer to complete your order.",
        eTransferEmail: "payments@shopeverywhere.com",
        eTransferCode: "Use this code as the security answer:",
        copyCode: "Copy Code",
        copied: "Copied!",
        pendingPayment: "Pending Payment",
        pendingMessage: "Your order is pending payment. Once we receive your e-transfer, we will process your order.",
        cancelOrder: "Cancel Order",
        orderPlaced: "Order Placed!",
        orderConfirmation: "Thank you for your order. You will receive a confirmation email once payment is received.",
        orderNumber: "Order Number",
        itemsRemoved: "items were removed because they are not available in the new zone.",
        loading: "Loading...",
        save: "Save Address",
        enterAddress: "Enter your address...",
        city: "City",
        state: "State / Province",
        postalCode: "Postal Code",
        country: "Country",
        quantity: "Qty",
        items: "items",
        item: "item",
    },
    fr: {
        checkout: "Paiement",
        orderSummary: "Résumé de la commande",
        shippingAddress: "Adresse de livraison",
        changeAddress: "Changer l'adresse",
        subtotal: "Sous-total",
        gst: "TPS (5%)",
        qst: "TVQ (9,975%)",
        total: "Total",
        confirmOrder: "Confirmer la commande",
        backToCart: "Retour au panier",
        emptyCart: "Votre panier est vide",
        goShopping: "Magasiner",
        addressChangeWarning: "Avertissement de changement de zone",
        addressChangeMessage: "La nouvelle adresse est dans une zone de livraison différente. Certains articles pourraient ne pas être disponibles pour la livraison à cette adresse et seront retirés de votre panier.",
        proceed: "Continuer quand même",
        cancel: "Annuler",
        eTransferInstructions: "Instructions de virement Interac",
        eTransferMessage: "Veuillez envoyer un virement Interac pour compléter votre commande.",
        eTransferEmail: "payments@shopeverywhere.com",
        eTransferCode: "Utilisez ce code comme réponse de sécurité:",
        copyCode: "Copier le code",
        copied: "Copié!",
        pendingPayment: "Paiement en attente",
        pendingMessage: "Votre commande est en attente de paiement. Une fois votre virement reçu, nous traiterons votre commande.",
        cancelOrder: "Annuler la commande",
        orderPlaced: "Commande passée!",
        orderConfirmation: "Merci pour votre commande. Vous recevrez un courriel de confirmation une fois le paiement reçu.",
        orderNumber: "Numéro de commande",
        itemsRemoved: "articles ont été retirés car ils ne sont pas disponibles dans la nouvelle zone.",
        loading: "Chargement...",
        save: "Enregistrer l'adresse",
        enterAddress: "Entrez votre adresse...",
        city: "Ville",
        state: "Province / État",
        postalCode: "Code postal",
        country: "Pays",
        quantity: "Qté",
        items: "articles",
        item: "article",
    },
    es: {
        checkout: "Pagar",
        orderSummary: "Resumen del pedido",
        shippingAddress: "Dirección de envío",
        changeAddress: "Cambiar dirección",
        subtotal: "Subtotal",
        gst: "GST (5%)",
        qst: "QST (9.975%)",
        total: "Total",
        confirmOrder: "Confirmar pedido",
        backToCart: "Volver al carrito",
        emptyCart: "Tu carrito está vacío",
        goShopping: "Ir de compras",
        addressChangeWarning: "Advertencia de cambio de zona",
        addressChangeMessage: "La nueva dirección está en una zona de envío diferente. Algunos artículos pueden no estar disponibles para entrega en esta dirección y serán eliminados de tu carrito.",
        proceed: "Continuar de todos modos",
        cancel: "Cancelar",
        eTransferInstructions: "Instrucciones de transferencia electrónica",
        eTransferMessage: "Por favor envíe una transferencia electrónica para completar su pedido.",
        eTransferEmail: "payments@shopeverywhere.com",
        eTransferCode: "Use este código como respuesta de seguridad:",
        copyCode: "Copiar código",
        copied: "¡Copiado!",
        pendingPayment: "Pago pendiente",
        pendingMessage: "Su pedido está pendiente de pago. Una vez que recibamos su transferencia, procesaremos su pedido.",
        cancelOrder: "Cancelar pedido",
        orderPlaced: "¡Pedido realizado!",
        orderConfirmation: "Gracias por su pedido. Recibirá un correo de confirmación una vez que se reciba el pago.",
        orderNumber: "Número de pedido",
        itemsRemoved: "artículos fueron eliminados porque no están disponibles en la nueva zona.",
        loading: "Cargando...",
        save: "Guardar dirección",
        enterAddress: "Ingrese su dirección...",
        city: "Ciudad",
        state: "Estado / Provincia",
        postalCode: "Código postal",
        country: "País",
        quantity: "Cant",
        items: "artículos",
        item: "artículo",
    },
};

function generateOrderCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SE-${timestamp}-${random}`;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    
    const { isLoaded: mapsLoaded } = useJsApiLoader({
        id: "google-maps-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [locale, setLocale] = useState("en");
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [addressDetails, setAddressDetails] = useState<LocationDetails | null>(null);
    const [zoneInfo, setZoneInfo] = useState<ZoneInfo | null>(null);
    const [step, setStep] = useState<CheckoutStep>("review");
    const [loading, setLoading] = useState(false);
    
    // Address editing
    const [editingAddress, setEditingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState({ address: "", city: "", state: "", postalCode: "", country: "" });
    const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
    
    // Zone change warning
    const [showZoneWarning, setShowZoneWarning] = useState(false);
    const [pendingNewZone, setPendingNewZone] = useState<{ location: LocationDetails; zone: ZoneInfo } | null>(null);
    const [removedItemsCount, setRemovedItemsCount] = useState(0);
    
    // Payment
    const [orderCode, setOrderCode] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [codeCopied, setCodeCopied] = useState(false);

    const t = (key: string) => (translations as any)[locale]?.[key] || (translations as any)["en"][key] || key;

    // Load data from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedLocale = localStorage.getItem("locale");
            if (savedLocale) setLocale(savedLocale);

            const savedCart = localStorage.getItem("se_checkout_cart");
            if (savedCart) {
                try {
                    setCartItems(JSON.parse(savedCart));
                } catch (e) {
                    console.error("Failed to parse cart", e);
                }
            }

            const savedLocation = localStorage.getItem("se_location");
            if (savedLocation) {
                try {
                    const parsed = JSON.parse(savedLocation);
                    if (parsed?.location) {
                        setAddressDetails(parsed.location);
                        if (parsed.location.latitude && parsed.location.longitude) {
                            setMapMarker({ lat: parsed.location.latitude, lng: parsed.location.longitude });
                        }
                    }
                    if (parsed?.zone) {
                        setZoneInfo(parsed.zone);
                    }
                } catch (e) {
                    console.error("Failed to parse location", e);
                }
            }
        }
    }, []);

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.minPrice * item.quantity, 0);
    const gst = subtotal * GST_RATE;
    const qst = subtotal * QST_RATE;
    const total = subtotal + gst + qst;
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddressSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addressForm),
            });
            const data = await res.json();
            
            if (!res.ok) {
                alert(data.error || "Failed to update address");
                setLoading(false);
                return;
            }

            const newLocation = data.location;
            const newZone = data.zone;

            // Check if zone changed
            if (zoneInfo?.zoneId && newZone?.zoneId !== zoneInfo.zoneId) {
                setPendingNewZone({ location: newLocation, zone: newZone });
                setShowZoneWarning(true);
            } else {
                // Same zone, just update
                setAddressDetails(newLocation);
                setZoneInfo(newZone);
                if (newLocation.latitude && newLocation.longitude) {
                    setMapMarker({ lat: newLocation.latitude, lng: newLocation.longitude });
                }
                localStorage.setItem("se_location", JSON.stringify({ location: newLocation, zone: newZone }));
                setEditingAddress(false);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update address");
        } finally {
            setLoading(false);
        }
    };

    const handleProceedWithZoneChange = async () => {
        if (!pendingNewZone) return;
        
        setLoading(true);
        try {
            // Get stores available in new zone
            const res = await fetch(`/api/admin/zones/${pendingNewZone.zone.zoneId}/stores`);
            const storeData = await res.json();
            const availableStoreIds = new Set(storeData.stores?.map((s: any) => s.id) || []);

            // Filter cart items to only those in the new zone
            const filteredItems = cartItems.filter(item => {
                // If product has storeId, check if it's in the zone
                if (item.product.storeId) {
                    return availableStoreIds.has(item.product.storeId);
                }
                // If no storeId, we need to check via product lookup
                return true; // Keep for now, would need API call
            });

            const removedCount = cartItems.length - filteredItems.length;
            setRemovedItemsCount(removedCount);

            // Update state
            setCartItems(filteredItems);
            setAddressDetails(pendingNewZone.location);
            setZoneInfo(pendingNewZone.zone);
            if (pendingNewZone.location.latitude && pendingNewZone.location.longitude) {
                setMapMarker({ lat: pendingNewZone.location.latitude, lng: pendingNewZone.location.longitude });
            }
            
            // Update localStorage
            localStorage.setItem("se_location", JSON.stringify({ location: pendingNewZone.location, zone: pendingNewZone.zone }));
            localStorage.setItem("se_checkout_cart", JSON.stringify(filteredItems));
            
            setShowZoneWarning(false);
            setPendingNewZone(null);
            setEditingAddress(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        setLoading(true);
        try {
            const code = generateOrderCode();
            const number = generateOrderNumber();
            setOrderCode(code);
            setOrderNumber(number);

            // Create order in database
            const orderData = {
                orderNumber: number,
                paymentCode: code,
                items: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.minPrice,
                })),
                subtotal,
                gst,
                qst,
                total,
                shippingAddress: addressDetails,
                zoneId: zoneInfo?.zoneId,
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            if (res.ok) {
                setStep("pending");
                // Clear cart from localStorage
                localStorage.removeItem("se_checkout_cart");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to create order");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create order");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!orderNumber) return;
        
        setLoading(true);
        try {
            await fetch(`/api/orders/${orderNumber}/cancel`, { method: "POST" });
            router.push("/");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(orderCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    if (cartItems.length === 0 && step === "review") {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("emptyCart")}</h1>
                <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                    {t("goShopping")}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 h-16 flex items-center">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
                        <ArrowLeft size={20} />
                        <span>{t("backToCart")}</span>
                    </Link>
                    <h1 className="flex-1 text-center text-xl font-bold text-indigo-600">{t("checkout")}</h1>
                    <div className="w-24"></div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {step === "review" && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-bold mb-4">{t("orderSummary")} ({itemCount} {itemCount === 1 ? t("item") : t("items")})</h2>
                                
                                {removedItemsCount > 0 && (
                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                                        {removedItemsCount} {t("itemsRemoved")}
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div key={item.product.id} className="flex gap-4 border-b pb-4">
                                            <div className="relative w-20 h-20 flex-shrink-0">
                                                <Image
                                                    src={item.product.imageUrl || "https://placehold.co/100"}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover rounded"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium">{item.product.name}</h3>
                                                <p className="text-sm text-gray-500">{item.product.ownerStoreName}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm text-gray-600">{t("quantity")}: {item.quantity}</span>
                                                    <span className="font-semibold text-indigo-600">
                                                        ${(item.product.minPrice * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <MapPin size={20} className="text-indigo-600" />
                                        {t("shippingAddress")}
                                    </h2>
                                    {!editingAddress && (
                                        <button
                                            onClick={() => {
                                                setEditingAddress(true);
                                                setAddressForm({
                                                    address: addressDetails?.address || "",
                                                    city: addressDetails?.city || "",
                                                    state: addressDetails?.state || "",
                                                    postalCode: addressDetails?.postalCode || "",
                                                    country: addressDetails?.country || "",
                                                });
                                            }}
                                            className="text-indigo-600 hover:underline text-sm"
                                        >
                                            {t("changeAddress")}
                                        </button>
                                    )}
                                </div>

                                {editingAddress ? (
                                    <div className="space-y-4">
                                        <div className="grid gap-3">
                                            <input
                                                type="text"
                                                placeholder={t("enterAddress")}
                                                className="w-full rounded-md border px-4 py-2"
                                                value={addressForm.address}
                                                onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder={t("city")}
                                                    className="rounded-md border px-4 py-2"
                                                    value={addressForm.city}
                                                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={t("state")}
                                                    className="rounded-md border px-4 py-2"
                                                    value={addressForm.state}
                                                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder={t("postalCode")}
                                                    className="rounded-md border px-4 py-2"
                                                    value={addressForm.postalCode}
                                                    onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={t("country")}
                                                    className="rounded-md border px-4 py-2"
                                                    value={addressForm.country}
                                                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {/* Map */}
                                        <div className="h-48 rounded-md overflow-hidden border">
                                            {mapsLoaded ? (
                                                <GoogleMap
                                                    mapContainerStyle={{ width: "100%", height: "100%" }}
                                                    center={mapMarker || { lat: 45.5017, lng: -73.5673 }}
                                                    zoom={mapMarker ? 15 : 10}
                                                    onClick={(e) => {
                                                        if (e.latLng) {
                                                            const lat = e.latLng.lat();
                                                            const lng = e.latLng.lng();
                                                            setMapMarker({ lat, lng });
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
                                                    <p className="text-gray-500 text-sm">{t("loading")}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setEditingAddress(false)}
                                                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                                            >
                                                {t("cancel")}
                                            </button>
                                            <button
                                                onClick={handleAddressSubmit}
                                                disabled={loading}
                                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {loading ? t("loading") : t("save")}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium">{addressDetails?.address}</p>
                                        <p className="text-gray-600">
                                            {[addressDetails?.city, addressDetails?.state, addressDetails?.postalCode].filter(Boolean).join(", ")}
                                        </p>
                                        <p className="text-gray-600">{addressDetails?.country}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Total */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                                <h2 className="text-lg font-bold mb-4">{t("orderSummary")}</h2>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t("subtotal")}</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t("gst")}</span>
                                        <span>${gst.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t("qst")}</span>
                                        <span>${qst.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>{t("total")}</span>
                                            <span className="text-indigo-600">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmOrder}
                                    disabled={loading || editingAddress}
                                    className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={20} />}
                                    {t("confirmOrder")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === "pending" && (
                    <div className="max-w-lg mx-auto">
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-yellow-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{t("pendingPayment")}</h2>
                            <p className="text-gray-600 mb-6">{t("pendingMessage")}</p>

                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="font-bold mb-4">{t("eTransferInstructions")}</h3>
                                <p className="text-sm text-gray-600 mb-4">{t("eTransferMessage")}</p>
                                
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg p-4 border">
                                        <p className="text-sm text-gray-500 mb-1">Email</p>
                                        <p className="font-mono font-medium">{t("eTransferEmail")}</p>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg p-4 border">
                                        <p className="text-sm text-gray-500 mb-1">{t("eTransferCode")}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-mono font-bold text-xl tracking-wider">{orderCode}</p>
                                            <button
                                                onClick={copyToClipboard}
                                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                                            >
                                                {codeCopied ? <Check size={18} /> : <Copy size={18} />}
                                                <span className="text-sm">{codeCopied ? t("copied") : t("copyCode")}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border">
                                        <p className="text-sm text-gray-500 mb-1">{t("total")}</p>
                                        <p className="font-bold text-2xl text-indigo-600">${total.toFixed(2)}</p>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border">
                                        <p className="text-sm text-gray-500 mb-1">{t("orderNumber")}</p>
                                        <p className="font-mono">{orderNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={loading}
                                    className="flex-1 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                >
                                    {t("cancelOrder")}
                                </button>
                                <Link
                                    href="/"
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
                                >
                                    {t("goShopping")}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Zone Change Warning Modal */}
            {showZoneWarning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="text-yellow-600" size={20} />
                            </div>
                            <h2 className="text-lg font-bold">{t("addressChangeWarning")}</h2>
                        </div>
                        <p className="text-gray-600 mb-6">{t("addressChangeMessage")}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowZoneWarning(false);
                                    setPendingNewZone(null);
                                }}
                                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                onClick={handleProceedWithZoneChange}
                                disabled={loading}
                                className="flex-1 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                            >
                                {loading ? t("loading") : t("proceed")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
