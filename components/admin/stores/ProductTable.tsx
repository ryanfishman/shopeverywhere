"use client";

import Image from "next/image";
import { Plus, Pencil, Trash2, Package, ImageIcon, ChevronDown } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { ProductRecord, CategoryNode } from "./types";

interface ProductTableProps {
  categoryId: string;
  products: ProductRecord[];
  locale: string;
  onEditProduct: (categoryId: string, product: ProductRecord) => void;
  onDeleteProduct: (product: ProductRecord) => void;
  onAddProduct: (categoryId: string) => void;
  onImageClick: (imageUrl: string | null) => void;
}

function ProductList({
  categoryId,
  products,
  locale,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  onImageClick,
}: ProductTableProps) {
  const categoryProducts = products.filter((p) => p.categoryId === categoryId);

  return (
    <div className="space-y-4">
      {/* Products Grid */}
      {categoryProducts.length > 0 ? (
        <div className="grid gap-3">
          {categoryProducts.map((product, index) => (
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
                      onClick={() => onImageClick(product.imageUrl)}
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
                    onClick={() => onEditProduct(categoryId, product)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 transition-colors"
                    title={t(locale, "edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(product)}
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
        onClick={() => onAddProduct(categoryId)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/50 text-slate-500 hover:text-amber-600 transition-all flex items-center justify-center gap-2 group"
      >
        <div className="w-7 h-7 rounded-lg bg-slate-200 group-hover:bg-amber-400 flex items-center justify-center transition-colors">
          <Plus className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>
        <span className="text-sm font-medium">{t(locale, "addProduct")}</span>
      </button>
    </div>
  );
}

interface ProductCategoriesAccordionProps {
  categories: CategoryNode[];
  products: ProductRecord[];
  locale: string;
  openCategoryIds: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  onEditProduct: (categoryId: string, product: ProductRecord) => void;
  onDeleteProduct: (product: ProductRecord) => void;
  onAddProduct: (categoryId: string) => void;
  onImageClick: (imageUrl: string | null) => void;
}

export function ProductCategoriesAccordion({
  categories,
  products,
  locale,
  openCategoryIds,
  onToggleCategory,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  onImageClick,
}: ProductCategoriesAccordionProps) {
  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const isOpen = openCategoryIds[category.id] ?? false;
        const productCount = products.filter((p) => p.categoryId === category.id).length;
        
        return (
          <div
            key={category.id}
            className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => onToggleCategory(category.id)}
              className={`w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors ${
                isOpen
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 text-slate-800"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isOpen
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Package className="h-4 w-4" />
                </div>
                <span>{getLocalizedName(category.nameTranslations, locale)}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    productCount > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
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
              <div className="p-4 border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
                <ProductList
                  categoryId={category.id}
                  products={products}
                  locale={locale}
                  onEditProduct={onEditProduct}
                  onDeleteProduct={onDeleteProduct}
                  onAddProduct={onAddProduct}
                  onImageClick={onImageClick}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

