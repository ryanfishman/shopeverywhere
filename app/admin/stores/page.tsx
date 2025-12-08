"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { LANGUAGES, getLocalizedName } from "@/lib/i18n";
import { Plus, Search, SlidersHorizontal, Loader2, Save, ChevronDown, Trash2, X, CheckCircle2, AlertCircle, ImageIcon, Upload, Pencil, Package, Building2, MapPin, Globe, FileText, Navigation, Map } from "lucide-react";
import { LocationPickerModal, LocationData } from "@/components/LocationPickerModal";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_CONFIG } from "@/lib/googleMaps";
import Image from "next/image";
import { t } from "@/translations/translations";

type StoreRecord = {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  shortDescriptionTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  imageUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
};

type CategoryNode = {
  id: string;
  nameTranslations: Record<string, string>;
  children?: CategoryNode[];
};

type ProductRecord = {
  id: string;
  categoryId: string;
  storeId: string;
  nameTranslations: Record<string, string>;
  shortDescriptionTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  imageUrl: string | null;
  price: number;
};

type ProductEditorState = {
  mode: "create" | "edit";
  categoryId: string;
  productId?: string;
  translations: Record<string, string>;
  shortDescription: Record<string, string>;
  longDescription: Record<string, string>;
  imageUrl: string;
  file: File | null;
  price: string;
};

const blankTranslations = () =>
  LANGUAGES.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = "";
    return acc;
  }, {});

const createBlankProductEditor = (categoryId: string): ProductEditorState => ({
  mode: "create",
  categoryId,
  translations: blankTranslations(),
  shortDescription: blankTranslations(),
  longDescription: blankTranslations(),
  imageUrl: "",
  file: null,
  price: "0",
});

const flattenLeaves = (nodes: CategoryNode[]): CategoryNode[] => {
  const leaves: CategoryNode[] = [];
  const traverse = (list: CategoryNode[]) => {
    list.forEach((node) => {
      if (!node.children || node.children.length === 0) {
        leaves.push(node);
      } else {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return leaves;
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [storeProducts, setStoreProducts] = useState<ProductRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locale, setLocale] = useState("en");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [openCategoryIds, setOpenCategoryIds] = useState<Record<string, boolean>>({});
  const [productEditor, setProductEditor] = useState<ProductEditorState | null>(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load Google Maps for geocoding
  useJsApiLoader(GOOGLE_MAPS_CONFIG);

  const [form, setForm] = useState({
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocale(localStorage.getItem("locale") || "en");
    }
  }, []);

  const fetchStores = async (query = "") => {
    setLoading(true);
    const res = await fetch(`/api/admin/stores${query ? `?search=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setStores(data.stores || []);
    if (!selectedId && data.stores?.[0]) {
      setSelectedId(data.stores[0].id);
      hydrateForm(data.stores[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
    fetchCategories();
  }, []);

  const hydrateForm = (store: StoreRecord) => {
    setForm({
      translations: { ...blankTranslations(), ...store.nameTranslations },
      shortDescription: { ...blankTranslations(), ...store.shortDescriptionTranslations },
      longDescription: { ...blankTranslations(), ...store.descriptionTranslations },
      address: store.address || "",
      city: store.city || "",
      state: store.state || "",
      country: store.country || "",
      postalCode: store.postalCode || "",
      latitude: store.latitude !== undefined && store.latitude !== null ? String(store.latitude) : "",
      longitude: store.longitude !== undefined && store.longitude !== null ? String(store.longitude) : "",
      imageUrl: store.imageUrl || "",
    });
    setImageFile(null);
    setImagePreview(store.imageUrl || null);
    setRemoveImage(false);
  };

  const hydrateProducts = (products: ProductRecord[]) => {
    setStoreProducts(products);
    setProductEditor((editor) => (editor ? { ...editor, file: null } : null));
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  };

  const fetchStoreDetail = async (id: string) => {
    const res = await fetch(`/api/admin/stores/${id}`);
    if (res.ok) {
      const data = await res.json();
      hydrateForm(data.store);
      hydrateProducts(data.products || []);
    }
  };

  const categoryLeaves = useMemo(() => flattenLeaves(categories), [categories]);

  const filteredStores = useMemo(() => {
    if (!search) return stores;
    const lower = search.toLowerCase();
    return stores.filter((store) =>
      getLocalizedName(store.nameTranslations, locale, store.name).toLowerCase().includes(lower)
    );
  }, [stores, search, locale]);

  const handleSelect = async (store: StoreRecord) => {
    setSelectedId(store.id);
    await fetchStoreDetail(store.id);
    setMobileSidebarOpen(false);
  };

  const handleAddStore = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        translations: { en: "New Store" },
        latitude: 0,
        longitude: 0,
      }),
    });
    if (res.ok) {
      const store = await res.json();
      await fetchStores(search);
      setSelectedId(store.id);
      await fetchStoreDetail(store.id);
    }
    setSaving(false);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    
    const formData = new FormData();
    formData.append("translations", JSON.stringify(form.translations));
    formData.append("shortDescription", JSON.stringify(form.shortDescription));
    formData.append("longDescription", JSON.stringify(form.longDescription));
    formData.append("address", form.address);
    formData.append("city", form.city);
    formData.append("state", form.state);
    formData.append("country", form.country);
    formData.append("postalCode", form.postalCode);
    formData.append("latitude", String(Number(form.latitude) || 0));
    formData.append("longitude", String(Number(form.longitude) || 0));
    
    if (removeImage) {
      formData.append("removeImage", "true");
    } else if (imageFile) {
      formData.append("image", imageFile);
    } else if (form.imageUrl) {
      formData.append("imageUrl", form.imageUrl);
    }
    
    const res = await fetch(`/api/admin/stores/${selectedId}`, {
      method: "PUT",
      body: formData,
    });
    if (res.ok) {
      const updatedStore = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: updatedStore.imageUrl || "" }));
      setImagePreview(updatedStore.imageUrl || null);
      setImageFile(null);
      setRemoveImage(false);
      await fetchStores(search);
    }
    setSaving(false);
  };

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

  const selectedStore = selectedId ? stores.find((store) => store.id === selectedId) : null;

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryIds((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

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

  const handleProductField = (
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
      return {
        ...prev,
        [field]: {
          ...(prev as any)[field],
          [langOrValue]: value,
        },
      };
    });
  };

  const submitProduct = async () => {
    if (!productEditor || !selectedId) return;
    setProductSaving(true);
    const fd = new FormData();
    fd.append("categoryId", productEditor.categoryId);
    fd.append("nameTranslations", JSON.stringify(productEditor.translations));
    fd.append("shortDescription", JSON.stringify(productEditor.shortDescription));
    fd.append("longDescription", JSON.stringify(productEditor.longDescription));
    fd.append("imageUrl", productEditor.imageUrl);
    fd.append("price", productEditor.price || "0");
    if (productEditor.file) {
      fd.append("file", productEditor.file);
    }
    if (productEditor.mode === "create") {
      fd.append("storeId", selectedId);
      await fetch("/api/admin/products", { method: "POST", body: fd });
    } else if (productEditor.productId) {
      fd.append("storeId", selectedId);
      await fetch(`/api/admin/products/${productEditor.productId}`, { method: "PUT", body: fd });
    }
    await fetchStoreDetail(selectedId);
    setProductEditor(null);
    setProductSaving(false);
  };

  const confirmDeleteProduct = async () => {
    if (!selectedId || !productToDelete) return;
    const productName = getLocalizedName(productToDelete.nameTranslations, locale);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: `${productName} ${t(locale, "deletedSuccessfully")}` });
        await fetchStoreDetail(selectedId);
      } else {
        setToast({ type: "error", message: t(locale, "deleteError") });
      }
    } catch {
      setToast({ type: "error", message: t(locale, "deleteError") });
    }
    setProductToDelete(null);
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;
    const storeName = getLocalizedName(storeToDelete.nameTranslations, locale, storeToDelete.name);
    try {
      const res = await fetch(`/api/admin/stores/${storeToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: `${storeName} ${t(locale, "deletedSuccessfully")}` });
        await fetchStores(search);
        setSelectedId((prev) => (prev === storeToDelete.id ? null : prev));
        setStoreProducts([]);
      } else {
        setToast({ type: "error", message: t(locale, "deleteError") });
      }
    } catch {
      setToast({ type: "error", message: t(locale, "deleteError") });
    }
    setStoreToDelete(null);
  };

  const renderProductTable = (categoryId: string) => {
    const products = storeProducts.filter((product) => product.categoryId === categoryId);

    return (
      <div className="space-y-4">
        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid gap-3">
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className="group bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {product.imageUrl ? (
                      <button
                        onClick={() => setImagePreviewUrl(product.imageUrl)}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-100 hover:border-amber-400 transition-colors shadow-sm group-hover:shadow-md"
                      >
                        <Image
                          src={product.imageUrl}
                          alt={getLocalizedName(product.nameTranslations, locale)}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </button>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">
                          {getLocalizedName(product.nameTranslations, locale)}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                          {getLocalizedName(product.shortDescriptionTranslations, locale, "No description")}
                        </p>
                      </div>
                      {/* Price Badge */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm shadow-sm shadow-green-500/25">
                          ${Number(product.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openProductEditor(categoryId, product)} 
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 transition-colors"
                      title={t(locale, "edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setProductToDelete(product)} 
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
                      title={t(locale, "delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 mb-4">{t(locale, "noProductsInCategory")}</p>
          </div>
        )}

        {/* Add Product Button */}
        <button
          onClick={() => openProductEditor(categoryId)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/50 text-slate-500 hover:text-amber-600 transition-all flex items-center justify-center gap-2 group"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-200 group-hover:bg-amber-400 flex items-center justify-center transition-colors">
            <Plus className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <span className="text-sm font-medium">{t(locale, "addProduct")}</span>
        </button>
      </div>
    );
  };

  const renderProductEditorModal = () => {
    if (!productEditor) return null;

    return (
      <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/50">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                {productEditor.mode === "create" ? t(locale, "addProduct") : t(locale, "editProduct")}
              </h3>
              <p className="text-slate-400 text-sm mt-0.5">Fill in the product details below</p>
            </div>
            <button 
              onClick={() => setProductEditor(null)} 
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Image & Price */}
              <div className="lg:col-span-1 space-y-5">
                {/* Product Image Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                    {t(locale, "productImage")}
                  </h4>
                  <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group">
                    {(productEditor.file || productEditor.imageUrl) ? (
                      <>
                        <Image
                          src={productEditor.file ? URL.createObjectURL(productEditor.file) : productEditor.imageUrl}
                          alt="Product preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="cursor-pointer p-3 bg-white rounded-xl shadow-lg">
                            <Upload className="h-5 w-5 text-slate-600" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleProductField("file", "", e.target.files?.[0] || null)}
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-500">Click to upload</span>
                        <span className="text-xs text-slate-400">PNG, JPG up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleProductField("file", "", e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:ring-amber-500 placeholder-slate-400"
                      value={productEditor.imageUrl}
                      onChange={(e) => handleProductField("imageUrl", e.target.value)}
                      placeholder="Or paste image URL..."
                    />
                  </div>
                </div>

                {/* Price Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50 p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    {t(locale, "price")}
                  </h4>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-green-600">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productEditor.price}
                      onChange={(e) => handleProductField("price", e.target.value)}
                      className="w-full rounded-xl border-2 border-green-200 bg-white pl-10 pr-4 py-4 text-2xl font-bold text-green-700 focus:border-green-400 focus:ring-green-400 placeholder-green-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Product Details */}
              <div className="lg:col-span-2 space-y-5">
                {/* Product Name Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">A</span>
                    {t(locale, "productName")}
                  </h4>
                  <div className="space-y-3">
                    {LANGUAGES.map((lang) => (
                      <div key={lang} className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 uppercase flex-shrink-0">
                          {lang}
                        </span>
                        <input
                          type="text"
                          value={productEditor.translations[lang] || ""}
                          onChange={(e) => handleProductField("translations", lang, e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-amber-500"
                          placeholder={`Product name in ${lang.toUpperCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Short Description Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs">📝</span>
                    {t(locale, "shortDescription")}
                  </h4>
                  <div className="space-y-3">
                    {LANGUAGES.map((lang) => (
                      <div key={`${lang}-short`} className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 uppercase flex-shrink-0">
                          {lang}
                        </span>
                        <input
                          type="text"
                          value={productEditor.shortDescription[lang] || ""}
                          onChange={(e) => handleProductField("shortDescription", lang, e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-amber-500"
                          placeholder="Brief description for listings..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long Description Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xs">📄</span>
                    {t(locale, "longDescription")}
                  </h4>
                  <div className="space-y-3">
                    {LANGUAGES.map((lang) => (
                      <div key={`${lang}-long`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 uppercase">
                            {lang}
                          </span>
                        </div>
                        <textarea
                          value={productEditor.longDescription[lang] || ""}
                          onChange={(e) => handleProductField("longDescription", lang, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-amber-500 resize-none"
                          rows={3}
                          placeholder="Full product description..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {productEditor.mode === "create" ? "New product will be added to this store" : "Changes will be saved immediately"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setProductEditor(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {t(locale, "cancel")}
              </button>
              <button
                onClick={submitProduct}
                disabled={productSaving}
                className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all inline-flex items-center gap-2"
              >
                {productSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {productEditor.mode === "create" ? t(locale, "createProduct") : t(locale, "saveProduct")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTranslationInputs = (label: string, field: "translations" | "shortDescription" | "longDescription", isTextarea = false) => (
    <div className="space-y-3">
      {LANGUAGES.map((lang) => (
        <div key={lang} className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase flex-shrink-0 mt-0.5">
            {lang}
          </span>
          {isTextarea ? (
            <textarea
              value={form[field][lang] || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [field]: { ...prev[field], [lang]: e.target.value },
                }))
              }
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500 resize-none"
              rows={2}
              placeholder={`${label} in ${lang.toUpperCase()}`}
            />
          ) : (
            <input
              type="text"
              value={form[field][lang] || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [field]: { ...prev[field], [lang]: e.target.value },
                }))
              }
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
              placeholder={`${label} in ${lang.toUpperCase()}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const [storeToDelete, setStoreToDelete] = useState<StoreRecord | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Handle location picker save
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

  // Get display name from form (real-time)
  const getFormDisplayName = () => {
    return form.translations[locale] || form.translations.en || "Untitled Store";
  };

  // Get display address from form (real-time)
  const getFormDisplayAddress = () => {
    const parts = [form.address, form.city, form.state, form.postalCode, form.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "No address set";
  };

  // Check if address fields are complete enough for geocoding
  const canGeocodeAddress = form.address && form.city && form.state && form.country;

  // State for geocoding
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Geocode address to get coordinates
  const handleUpdateFromAddress = async () => {
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

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="relative flex gap-6 h-full">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      <button
        className="md:hidden fixed left-0 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center h-14 w-7 rounded-r-full bg-indigo-600 text-white shadow-lg"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open stores panel"
      >
        <span className="sr-only">Open stores</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        className={clsx(
          "w-72 bg-white border border-gray-200 rounded-lg p-4 flex flex-col transition-all",
          "md:static md:flex",
          mobileSidebarOpen ? "fixed inset-0 left-0 z-60 shadow-2xl md:shadow-none" : "hidden md:flex"
        )}
      >
        <div className="md:hidden flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-800">Stores</span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-[160px] border rounded-md px-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchStores(e.target.value);
              }}
              className="border-none focus:ring-0 text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="p-2 rounded-md border border-gray-200 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={handleAddStore}
            disabled={saving}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70"
          >
            <Plus className="h-4 w-4" />
          </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-3 rounded-md border border-dashed border-gray-300 p-3 text-xs text-gray-500">
            Advanced filters coming soon.
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            filteredStores.map((store) => {
              const label = getLocalizedName(store.nameTranslations, locale, store.name);
              const isSelected = store.id === selectedId;
              return (
                <div
                  key={store.id}
                  className={`w-full px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                    isSelected ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <button className="text-left flex-1" onClick={() => handleSelect(store)}>
                  {label}
                  <p className="text-xs text-gray-400">{store.city || store.country || "No address"}</p>
                </button>
                  <button
                    onClick={() => setStoreToDelete(store)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    aria-label={t(locale, "deleteStore")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden">
        {!selectedStore ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Store Selected</h3>
            <p className="text-slate-500 text-sm max-w-xs">Select a store from the list to view and edit its details.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header - Updates in real-time from form */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Store Avatar */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Store" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">
                      {getFormDisplayName()}
                    </h2>
                    <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{getFormDisplayAddress()}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-70 shadow-lg shadow-amber-500/25 transition-all flex-shrink-0"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Row 1: Store Image + Store Name (same height) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Store Image Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                    {t(locale, "storeImage")}
                  </h4>
                  <div className="flex-1 flex items-center gap-5">
                    {/* Image Preview */}
                    <div className="relative w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group flex-shrink-0">
                      {imagePreview ? (
                        <>
                          <Image src={imagePreview} alt="Store preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="cursor-pointer p-2 bg-white rounded-lg shadow-lg hover:bg-slate-50 transition-colors">
                              <Upload className="h-4 w-4 text-slate-600" />
                              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 p-4 text-center">
                          <Upload className="h-6 w-6 text-slate-400" />
                          <span className="text-xs text-slate-500">Upload</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      )}
                    </div>
                    {/* Upload Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Store Photo</p>
                        <p className="text-xs text-slate-400 mt-1">{t(locale, "imageHint")}</p>
                      </div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors">
                        <Upload className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">{t(locale, "uploadImage")}</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Store Name Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">A</span>
                    Store Name
                  </h4>
                  <div className="flex-1">
                    {renderTranslationInputs("Store Name", "translations")}
                  </div>
                </div>
              </div>

              {/* Short Description Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Short Description
                </h4>
                {renderTranslationInputs("Short description", "shortDescription")}
              </div>

              {/* Long Description Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Long Description
                </h4>
                {renderTranslationInputs("Long description", "longDescription", true)}
              </div>

              {/* Location Card - Full Width with GPS merged */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    Location & Coordinates
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/25 transition-all"
                  >
                    <Map className="h-4 w-4" />
                    Open Map
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Address Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Street Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">City</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                          placeholder="Montreal"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Postal Code</label>
                        <input
                          type="text"
                          value={form.postalCode}
                          onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                          placeholder="H2X 1Y4"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Province / State</label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                          placeholder="Quebec"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Country</label>
                        <input
                          type="text"
                          value={form.country}
                          onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                          placeholder="Canada"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: GPS Coordinates */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-blue-500" />
                        GPS Coordinates
                      </h5>
                      <button
                        type="button"
                        onClick={handleUpdateFromAddress}
                        disabled={!canGeocodeAddress || isGeocoding}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeocoding ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        Update from Address
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-blue-600 uppercase tracking-wider">Latitude</label>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-mono">LAT</span>
                          <input
                            type="number"
                            step="any"
                            value={form.latitude}
                            onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                            className="w-full rounded-xl border-2 border-blue-200 bg-white pl-14 pr-4 py-3 text-sm font-mono focus:border-blue-400 focus:ring-blue-400"
                            placeholder="45.5017"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-blue-600 uppercase tracking-wider">Longitude</label>
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-mono">LNG</span>
                          <input
                            type="number"
                            step="any"
                            value={form.longitude}
                            onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                            className="w-full rounded-xl border-2 border-blue-200 bg-white pl-14 pr-4 py-3 text-sm font-mono focus:border-blue-400 focus:ring-blue-400"
                            placeholder="-73.5673"
                          />
                        </div>
                      </div>
                    </div>
                    {!canGeocodeAddress && (
                      <p className="text-xs text-blue-400 mt-3">
                        Fill in address, city, state, and country to enable &quot;Update from Address&quot;
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-500" />
                  Products
                </h3>
                <div className="space-y-4">
                  {categoryLeaves.map((category) => {
                    const isOpen = openCategoryIds[category.id] ?? false;
                    const productCount = storeProducts.filter((p) => p.categoryId === category.id).length;
                    return (
                      <div key={category.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className={`w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors ${
                            isOpen 
                              ? "bg-gradient-to-r from-amber-50 to-orange-50 text-slate-800" 
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isOpen 
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30" 
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              <Package className="h-4 w-4" />
                            </div>
                            <span>{getLocalizedName(category.nameTranslations, locale)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              productCount > 0 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {productCount} {productCount === 1 ? "item" : "items"}
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-amber-600" : "text-slate-400"
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="p-4 border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">{renderProductTable(category.id)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {storeToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t(locale, "deleteStore")}</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{t(locale, "deleteStoreConfirm")}</p>
              <p className="text-sm font-semibold text-gray-900">
                {getLocalizedName(storeToDelete.nameTranslations, locale, storeToDelete.name)}
              </p>
              <p className="text-xs text-gray-500">
                {[storeToDelete.address, storeToDelete.city, storeToDelete.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t(locale, "cancel")}
              </button>
              <button
                onClick={confirmDeleteStore}
                className="px-4 py-2 rounded-md bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t(locale, "delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Editor Modal */}
      {renderProductEditorModal()}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {t(locale, "deleteProduct")}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                {t(locale, "deleteProductConfirm")}
              </p>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                {productToDelete.imageUrl && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-red-200 flex-shrink-0">
                    <Image
                      src={productToDelete.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="font-semibold text-red-800">
                  {getLocalizedName(productToDelete.nameTranslations, locale)}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                {t(locale, "cancel")}
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all"
              >
                {t(locale, "delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
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

      {/* Image Preview Modal */}
      {imagePreviewUrl && (
        <div 
          className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImagePreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setImagePreviewUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative w-full h-[80vh] rounded-2xl overflow-hidden bg-slate-800">
              <Image
                src={imagePreviewUrl}
                alt="Product image"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={clsx(
          "fixed bottom-6 right-6 z-[90] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all animate-slide-in-left",
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

