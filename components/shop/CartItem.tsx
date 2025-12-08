"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { CartItem as CartItemType } from "./types";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItemCard = ({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) => {
  return (
    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
        <Image
          src={item.product.imageUrl || "https://placehold.co/100"}
          alt={item.product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{item.product.name}</h4>
        <p className="text-xs text-amber-600 font-medium">{item.product.ownerStoreName}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="font-bold text-slate-800">${Number(item.product.minPrice).toFixed(2)}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center font-semibold text-slate-700">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              +
            </button>
            <button
              onClick={() => onRemove(item.product.id)}
              className="ml-2 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

