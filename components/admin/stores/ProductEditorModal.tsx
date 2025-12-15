"use client";

import Image from "next/image";
import { X, Loader2, Save, Upload, ImageIcon } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { ProductEditorState } from "./types";

interface ProductEditorModalProps {
  editor: ProductEditorState | null;
  locale: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (
    field: "translations" | "shortDescription" | "longDescription" | "imageUrl" | "file" | "price",
    langOrValue: string,
    value?: string | File | null
  ) => void;
}

export function ProductEditorModal({
  editor,
  locale,
  saving,
  onClose,
  onSubmit,
  onChange,
}: ProductEditorModalProps) {
  if (!editor) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              {editor.mode === "create" ? t(locale, "addProduct") : t(locale, "editProduct")}
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">Fill in the product details below</p>
          </div>
          <button
            onClick={onClose}
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
                  {(editor.file || editor.imageUrl) ? (
                    <>
                      <Image
                        src={editor.file ? URL.createObjectURL(editor.file) : editor.imageUrl}
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
                            onChange={(e) => onChange("file", "", e.target.files?.[0] || null)}
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
                        onChange={(e) => onChange("file", "", e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:ring-amber-500 placeholder-slate-400"
                    value={editor.imageUrl}
                    onChange={(e) => onChange("imageUrl", e.target.value)}
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
                    value={editor.price}
                    onChange={(e) => onChange("price", e.target.value)}
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
                        value={editor.translations[lang] || ""}
                        onChange={(e) => onChange("translations", lang, e.target.value)}
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
                        value={editor.shortDescription[lang] || ""}
                        onChange={(e) => onChange("shortDescription", lang, e.target.value)}
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
                        value={editor.longDescription[lang] || ""}
                        onChange={(e) => onChange("longDescription", lang, e.target.value)}
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
            {editor.mode === "create" ? "New product will be added to this store" : "Changes will be saved immediately"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t(locale, "cancel")}
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editor.mode === "create" ? t(locale, "createProduct") : t(locale, "saveProduct")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



