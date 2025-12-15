"use client";

import Image from "next/image";
import { getLocalizedName } from "@/lib/i18n";
import { t } from "@/translations/translations";
import type { ProductRecord } from "./types";

interface DeleteProductModalProps {
  product: ProductRecord | null;
  locale: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteProductModal({
  product,
  locale,
  onConfirm,
  onCancel,
}: DeleteProductModalProps) {
  if (!product) return null;

  return (
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
            {product.imageUrl && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-red-200 flex-shrink-0">
                <Image
                  src={product.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <p className="font-semibold text-red-800">
              {getLocalizedName(product.nameTranslations, locale)}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            {t(locale, "cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg transition-all"
          >
            {t(locale, "delete")}
          </button>
        </div>
      </div>
    </div>
  );
}



