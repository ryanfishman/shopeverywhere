"use client";

import { Search } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Product } from "./types";

interface ProductGridProps {
  products: Product[];
  locale: string;
  onProductClick: (product: Product) => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  t: (key: string) => string;
}

export const ProductGrid = ({
  products,
  locale,
  onProductClick,
  loading,
  hasMore,
  onLoadMore,
  t,
}: ProductGridProps) => {
  return (
    <>
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            onProductClick={onProductClick}
            t={t}
          />
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
            <Search className="h-10 w-10 text-slate-400" />
          </div>
          <p className="text-slate-500 text-lg">{t('noProducts')}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-sm border border-slate-200/60">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-600 font-medium">{t('loading')}</span>
          </div>
        </div>
      )}

      {/* Pagination / Load More */}
      {hasMore && !loading && products.length > 0 && (
        <div className="mt-12 text-center">
          <button
            onClick={onLoadMore}
            className="px-8 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-600 shadow-lg hover:shadow-xl transition-all"
          >
            {t('loadMore')}
          </button>
        </div>
      )}
    </>
  );
};



