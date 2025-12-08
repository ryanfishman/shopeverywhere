"use client";

import { useEffect, useMemo, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";
import { getLocalizedName } from "@/lib/i18n";
import { LocationPickerModal, LocationData } from "@/components/LocationPickerModal";
import { t } from "@/translations/translations";

// Import API services
import {
  fetchStores as apiFetchStores,
  fetchStoreDetail as apiFetchStoreDetail,
  fetchStoreCategories,
  createStore,
  updateStore,
  deleteStore as apiDeleteStore,
  createProduct,
  updateProduct,
  deleteProduct as apiDeleteProduct,
  flattenCategoryLeaves,
  buildStoreFormData,
  buildProductFormData,
  hydrateStoreForm,
} from "@/lib/api";
import type {
  StoreRecord,
  CategoryNode,
  ProductRecord,
  StoreFormData,
  ProductEditorState,
} from "@/lib/api";

// Import components
import {
  blankTranslations,
  createBlankProductEditor,
  StoreSidebar,
  StoreForm,
  StoreFormEmpty,
  ProductEditorModal,
  DeleteStoreModal,
  DeleteProductModal,
  ImagePreviewModal,
  Toast,
} from "@/components/admin/stores";

export default function AdminStoresPage() {
  // Load Google Maps for geocoding
  useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // Locale
  const [locale, setLocale] = useState("en");

  // Store list state
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Store detail state
  const [storeProducts, setStoreProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [openCategoryIds, setOpenCategoryIds] = useState<Record<string, boolean>>({});

  // Form state
  const [form, setForm] = useState<StoreFormData>({
    translations: blankTranslations(),
    shortDescription: blankTranslations(),
    longDescription: blankTranslations(),
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Product editor state
  const [productEditor, setProductEditor] = useState<ProductEditorState | null>(null);
  const [productSaving, setProductSaving] = useState(false);

  // Modal states
  const [storeToDelete, setStoreToDelete] = useState<StoreRecord | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Geocoding state
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Get leaf categories for product management
  const categoryLeaves = useMemo(() => flattenCategoryLeaves(categories), [categories]);

  // Selected store
  const selectedStore = selectedId ? stores.find((s) => s.id === selectedId) : null;

  // Initialize locale
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocale(localStorage.getItem("locale") || "en");
    }
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchStores();
    fetchCategories();
  }, []);

  // API Functions
  const fetchStores = async (query = "") => {
    setLoading(true);
    try {
      const data = await apiFetchStores(query);
    setStores(data.stores || []);
    if (!selectedId && data.stores?.[0]) {
      setSelectedId(data.stores[0].id);
      hydrateForm(data.stores[0]);
    }
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
    setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await fetchStoreCategories();
    setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchStoreDetail = async (id: string) => {
    try {
      const data = await apiFetchStoreDetail(id);
      hydrateForm(data.store);
      setStoreProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching store detail:", error);
    }
  };

  // Form hydration
  const hydrateForm = (store: StoreRecord) => {
    setForm(hydrateStoreForm(store, blankTranslations));
    setImageFile(null);
    setImagePreview(store.imageUrl || null);
    setRemoveImage(false);
  };

  // Store handlers
  const handleSelectStore = async (store: StoreRecord) => {
    setSelectedId(store.id);
    await fetchStoreDetail(store.id);
  };

  const handleAddStore = async () => {
    setSaving(true);
    try {
      const store = await createStore({
        translations: { en: "New Store" },
        latitude: 0,
        longitude: 0,
    });
      await fetchStores();
      setSelectedId(store.id);
      await fetchStoreDetail(store.id);
    } catch (error) {
      console.error("Error creating store:", error);
    } finally {
    setSaving(false);
    }
  };

  const handleSaveStore = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const formData = buildStoreFormData(form, imageFile, removeImage);
      const updatedStore = await updateStore(selectedId, formData);
      setForm((prev) => ({ ...prev, imageUrl: updatedStore.imageUrl || "" }));
      setImagePreview(updatedStore.imageUrl || null);
      setImageFile(null);
      setRemoveImage(false);
      await fetchStores();
    } catch (error) {
      console.error("Error saving store:", error);
    } finally {
    setSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    const storeName = getLocalizedName(storeToDelete.nameTranslations, locale, storeToDelete.name);
    try {
      await apiDeleteStore(storeToDelete.id);
      setToast({ type: "success", message: `${storeName} ${t(locale, "deletedSuccessfully")}` });
      await fetchStores();
      if (selectedId === storeToDelete.id) {
        setSelectedId(null);
        setStoreProducts([]);
      }
    } catch {
      setToast({ type: "error", message: t(locale, "deleteError") });
    }
    setStoreToDelete(null);
  };

  // Image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  // Translation field change handler
  const handleTranslationChange = (
    field: "translations" | "shortDescription" | "longDescription",
    lang: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  };

  // Category accordion
  const toggleCategory = (categoryId: string) => {
    setOpenCategoryIds((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  // Product editor handlers
  const openProductEditor = (categoryId: string, product?: ProductRecord) => {
    if (product) {
      setProductEditor({
        mode: "edit",
        categoryId,
        productId: product.id,
        translations: { ...blankTranslations(), ...product.nameTranslations },
        shortDescription: { ...blankTranslations(), ...product.shortDescriptionTranslations },
        longDescription: { ...blankTranslations(), ...product.descriptionTranslations },
        imageUrl: product.imageUrl || "",
        file: null,
        price: product.price?.toString() || "0",
      });
    } else {
      setProductEditor(createBlankProductEditor(categoryId));
    }
  };

  const handleProductFieldChange = (
    field: "translations" | "shortDescription" | "longDescription" | "imageUrl" | "file" | "price",
    langOrValue: string,
    value?: string | File | null
  ) => {
    setProductEditor((prev) => {
      if (!prev) return prev;
      if (field === "imageUrl") {
        return { ...prev, imageUrl: langOrValue };
      }
      if (field === "file") {
        return { ...prev, file: value as File | null };
      }
      if (field === "price") {
        return { ...prev, price: langOrValue };
      }
      // For translation fields (translations, shortDescription, longDescription)
      const translationField = field as "translations" | "shortDescription" | "longDescription";
      return {
        ...prev,
        [translationField]: {
          ...prev[translationField],
          [langOrValue]: value as string,
        },
      };
    });
  };

  const submitProduct = async () => {
    if (!productEditor || !selectedId) return;
    setProductSaving(true);
    try {
      const fd = buildProductFormData(productEditor, selectedId);
    if (productEditor.mode === "create") {
        await createProduct(fd);
    } else if (productEditor.productId) {
        await updateProduct(productEditor.productId, fd);
    }
    await fetchStoreDetail(selectedId);
    setProductEditor(null);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
    setProductSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedId || !productToDelete) return;
    const productName = getLocalizedName(productToDelete.nameTranslations, locale);
    try {
      await apiDeleteProduct(productToDelete.id);
        setToast({ type: "success", message: `${productName} ${t(locale, "deletedSuccessfully")}` });
        await fetchStoreDetail(selectedId);
    } catch {
      setToast({ type: "error", message: t(locale, "deleteError") });
    }
    setProductToDelete(null);
  };

  // Location picker handler
  const handleLocationPickerSave = (location: LocationData) => {
    setForm((prev) => ({
      ...prev,
      address: location.address,
      city: location.city,
      state: location.state,
      postalCode: location.postalCode,
      country: location.country,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    }));
    setShowLocationPicker(false);
  };

  // Geocode address to get coordinates
  const handleUpdateFromAddress = async () => {
    const canGeocodeAddress = form.address && form.city && form.state && form.country;
    if (!canGeocodeAddress) return;
    if (typeof google === "undefined") {
      setToast({ type: "error", message: "Google Maps not loaded" });
      return;
    }

    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    const addressString = [form.address, form.city, form.state, form.postalCode, form.country]
      .filter(Boolean)
      .join(", ");

    geocoder.geocode({ address: addressString }, (results, status) => {
      setIsGeocoding(false);
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        setForm((prev) => ({
          ...prev,
          latitude: String(location.lat()),
          longitude: String(location.lng()),
        }));
        setToast({ type: "success", message: "Coordinates updated from address" });
      } else {
        setToast({ type: "error", message: "Could not find coordinates for this address" });
      }
    });
  };

  return (
    <div className="relative flex gap-6 h-full">
      {/* Store Sidebar */}
      <StoreSidebar
        stores={stores}
        selectedId={selectedId}
        locale={locale}
        loading={loading}
        saving={saving}
        onSelect={handleSelectStore}
        onAdd={handleAddStore}
        onDelete={setStoreToDelete}
        onSearch={fetchStores}
      />

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden">
        {!selectedStore ? (
          <StoreFormEmpty />
        ) : (
          <StoreForm
            form={form}
            imagePreview={imagePreview}
            locale={locale}
            saving={saving}
            categories={categoryLeaves}
            products={storeProducts}
            openCategoryIds={openCategoryIds}
            onFormChange={setForm}
            onTranslationChange={handleTranslationChange}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
            onSave={handleSaveStore}
            onOpenLocationPicker={() => setShowLocationPicker(true)}
            onToggleCategory={toggleCategory}
            onEditProduct={openProductEditor}
            onDeleteProduct={setProductToDelete}
            onAddProduct={(categoryId) => openProductEditor(categoryId)}
            onImageClick={setImagePreviewUrl}
            onUpdateFromAddress={handleUpdateFromAddress}
            isGeocoding={isGeocoding}
          />
        )}
            </div>

      {/* Modals */}
      <DeleteStoreModal
        store={storeToDelete}
        locale={locale}
        onConfirm={handleDeleteStore}
        onCancel={() => setStoreToDelete(null)}
      />

      <DeleteProductModal
        product={productToDelete}
        locale={locale}
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />

      <ProductEditorModal
        editor={productEditor}
        locale={locale}
        saving={productSaving}
        onClose={() => setProductEditor(null)}
        onSubmit={submitProduct}
        onChange={handleProductFieldChange}
      />

      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSave={handleLocationPickerSave}
        initialLocation={{
          address: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          latitude: parseFloat(form.latitude) || 0,
          longitude: parseFloat(form.longitude) || 0,
        }}
        title="Select Store Location"
      />

      <ImagePreviewModal
        imageUrl={imagePreviewUrl}
        onClose={() => setImagePreviewUrl(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
