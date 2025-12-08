"use client";

import Image from "next/image";
import { ShoppingCart, Building2, FolderTree, Minus, Plus } from "lucide-react";
import { getLocalizedName } from "@/lib/i18n";
import { Modal } from "./Modal";
import { Product } from "./types";

interface ProductModalProps {
  isOpen: boolean;
  product: Product | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onClose: () => void;
  isAddingToCart: boolean;
  locale: string;
  t: (key: string) => string;
}

export const ProductModal = ({
  isOpen,
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onClose,
  isAddingToCart,
  locale,
  t,
}: ProductModalProps) => {
  if (!isOpen || !product) return null;

  return (
    <Modal
      title={getLocalizedName(product.nameTranslations, locale, product.name)}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="relative h-72 w-full rounded-xl overflow-hidden bg-slate-100">
          <Image
            src={product.imageUrl || "https://placehold.co/400"}
            alt={getLocalizedName(product.nameTranslations, locale, product.name)}
            fill
            className="object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <Building2 size={12} />
              {product.ownerStoreName}
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1.5">
              <FolderTree size={12} />
              {getLocalizedName(product.categoryTranslations, locale, t('uncategorized'))}
            </span>
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">
            {getLocalizedName(product.descriptionTranslations, locale, product.description)}
          </p>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
            <span className="text-sm font-medium text-slate-600">{t('quantity') || 'Quantity'}:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="w-12 text-center font-semibold text-slate-800">{quantity}</span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-stone-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t('from')}</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                ${(Number(product.minPrice) * quantity).toFixed(2)}
              </p>
              {quantity > 1 && (
                <p className="text-xs text-slate-400">
                  ${Number(product.minPrice).toFixed(2)} × {quantity}
                </p>
              )}
            </div>
            <button
              onClick={onAddToCart}
              disabled={isAddingToCart}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3.5 rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all font-semibold"
            >
              <ShoppingCart size={20} />
              {isAddingToCart ? t('loading') : t('addToCart') || 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

