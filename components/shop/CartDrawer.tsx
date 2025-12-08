"use client";

import { ShoppingCart } from "lucide-react";
import { Drawer } from "./Drawer";
import { CartItemCard } from "./CartItem";
import { CartItem } from "./types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  t: (key: string) => string;
}

export const CartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  t,
}: CartDrawerProps) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.minPrice * item.quantity, 0);
  const gst = subtotal * 0.05;
  const qst = subtotal * 0.09975;
  const total = subtotal + gst + qst;

  return (
    <Drawer title={t('cartTitle')} isOpen={isOpen} onClose={onClose}>
      {cartItems.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-5">
            <ShoppingCart size={40} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">{t('cartEmpty')}</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 space-y-4 overflow-y-auto">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.product.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
          <div className="border-t border-slate-100 pt-5 mt-4">
            <div className="space-y-3 text-sm mb-5 bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between text-slate-600">
                <span>{t('subtotal') || 'Subtotal'}</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (5%)</span>
                <span>${gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>QST (9.975%)</span>
                <span>${qst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-200">
                <span className="text-slate-800">Total</span>
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all"
            >
              {t('checkout') || 'Checkout'}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
};

