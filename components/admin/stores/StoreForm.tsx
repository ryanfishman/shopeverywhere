"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Save,
  Loader2,
  ImageIcon,
  Upload,
  Trash2,
  Building2,
  MapPin,
  FileText,
  Navigation,
  Map,
  Package,
} from "lucide-react";
import { t } from "@/translations/translations";
import { TranslationInputs } from "./TranslationInputs";
import { ProductCategoriesAccordion } from "./ProductTable";
import type { StoreFormData, CategoryNode, ProductRecord } from "./types";

interface StoreFormProps {
  form: StoreFormData;
  imagePreview: string | null;
  locale: string;
  saving: boolean;
  categories: CategoryNode[];
  products: ProductRecord[];
  openCategoryIds: Record<string, boolean>;
  onFormChange: (form: StoreFormData) => void;
  onTranslationChange: (field: "translations" | "shortDescription" | "longDescription", lang: string, value: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onOpenLocationPicker: () => void;
  onToggleCategory: (categoryId: string) => void;
  onEditProduct: (categoryId: string, product: ProductRecord) => void;
  onDeleteProduct: (product: ProductRecord) => void;
  onAddProduct: (categoryId: string) => void;
  onImageClick: (imageUrl: string | null) => void;
  onUpdateFromAddress: () => void;
  isGeocoding: boolean;
}

export function StoreForm({
  form,
  imagePreview,
  locale,
  saving,
  categories,
  products,
  openCategoryIds,
  onFormChange,
  onTranslationChange,
  onImageChange,
  onRemoveImage,
  onSave,
  onOpenLocationPicker,
  onToggleCategory,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  onImageClick,
  onUpdateFromAddress,
  isGeocoding,
}: StoreFormProps) {
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

  return (
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
            onClick={onSave}
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
                        <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={onRemoveImage}
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
                    <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
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
                  <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
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
              <TranslationInputs
                field="translations"
                value={form.translations}
                onChange={onTranslationChange}
                label="Store Name"
              />
            </div>
          </div>
        </div>

        {/* Short Description Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Short Description
          </h4>
          <TranslationInputs
            field="shortDescription"
            value={form.shortDescription}
            onChange={onTranslationChange}
            label="Short description"
          />
        </div>

        {/* Long Description Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            Long Description
          </h4>
          <TranslationInputs
            field="longDescription"
            value={form.longDescription}
            onChange={onTranslationChange}
            label="Long description"
            isTextarea
          />
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
              onClick={onOpenLocationPicker}
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
                  onChange={(e) => onFormChange({ ...form, address: e.target.value })}
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
                    onChange={(e) => onFormChange({ ...form, city: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Montreal"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Postal Code</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => onFormChange({ ...form, postalCode: e.target.value })}
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
                    onChange={(e) => onFormChange({ ...form, state: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Quebec"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => onFormChange({ ...form, country: e.target.value })}
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
                  onClick={onUpdateFromAddress}
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
                      onChange={(e) => onFormChange({ ...form, latitude: e.target.value })}
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
                      onChange={(e) => onFormChange({ ...form, longitude: e.target.value })}
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
          <ProductCategoriesAccordion
            categories={categories}
            products={products}
            locale={locale}
            openCategoryIds={openCategoryIds}
            onToggleCategory={onToggleCategory}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
            onAddProduct={onAddProduct}
            onImageClick={onImageClick}
          />
        </div>
      </div>
    </div>
  );
}

// Empty state component for when no store is selected
export function StoreFormEmpty() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Building2 className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Store Selected</h3>
      <p className="text-slate-500 text-sm max-w-xs">Select a store from the list to view and edit its details.</p>
    </div>
  );
}

