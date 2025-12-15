"use client";

import Image from "next/image";
import { ShoppingCart, Building2, FolderTree } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import { Product } from "./types";

interface ProductCardProps {
  product: Product;
  locale: string;
  onProductClick: (product: Product) => void;
  t: (key: string) => string;
}

export const ProductCard = ({
  product,
  locale,
  onProductClick,
  t,
}: ProductCardProps) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div
        className="relative h-52 cursor-pointer overflow-hidden"
        onClick={() => onProductClick(product)}
      >
        <Image
          src={product.imageUrl || "https://placehold.co/200"}
          alt={getLocalizedName(product.nameTranslations, locale, product.name)}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="font-bold text-slate-800 leading-tight line-clamp-2 cursor-pointer hover:text-amber-600 transition-colors"
            onClick={() => onProductClick(product)}
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
            <p className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              ${Number(product.minPrice).toFixed(2)}
            </p>
          </div>
          <button
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all"
            onClick={() => onProductClick(product)}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};



