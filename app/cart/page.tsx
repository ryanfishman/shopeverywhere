"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (session) {
        fetchServerCart();
    } else {
        loadGuestCart();
    }
  }, [session]);

  const loadGuestCart = () => {
    const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
    setItems(guestCart);
    setLoading(false);
  };

  const fetchServerCart = async () => {
    try {
        const res = await fetch("/api/cart");
        const data = await res.json();
        
        // If we have items in guest cart, we should probably merge them?
        // For now, simpler approach: if guest cart exists, try to sync it once.
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
        if (guestCart.length > 0) {
            await syncGuestCart(guestCart);
            localStorage.removeItem("guestCart");
            // Re-fetch
            const res2 = await fetch("/api/cart");
            const data2 = await res2.json();
            setItems(data2.items);
        } else {
            setItems(data.items);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const syncGuestCart = async (guestItems: any[]) => {
      for (const item of guestItems) {
          await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  productId: item.productId,
                  storeProductId: item.storeProductId,
                  quantity: item.quantity
              })
          });
      }
  };

  const checkout = () => {
      if (!session) {
          router.push("/auth/login?callbackUrl=/cart");
          return;
      }
      // Proceed to checkout logic (create order)
      router.push("/checkout");
  };

  const total = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  if (loading) return <div className="p-8">Loading cart...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      {items.length === 0 ? (
          <div className="text-center py-10">
              <p className="text-xl mb-4">Your cart is empty</p>
              <Link href="/" className="text-indigo-600 hover:underline">Start Shopping</Link>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                  {items.map((item, idx) => (
                      <div key={item.id || idx} className="flex gap-4 p-4 bg-white rounded-lg shadow border">
                          <div className="relative w-24 h-24 flex-shrink-0">
                               <Image src={item.product?.imageUrl || item.imageUrl || "https://placehold.co/200"} alt={item.product?.name || item.productName} fill className="object-cover rounded" />
                          </div>
                          <div className="flex-1">
                              <h3 className="font-bold text-lg">{item.product?.name || item.productName}</h3>
                              <p className="text-sm text-gray-500">{item.storeName}</p>
                              <div className="flex justify-between items-center mt-2">
                                  <p className="font-medium">Qty: {item.quantity}</p>
                                  <p className="font-bold text-indigo-600">${Number(item.price).toFixed(2)}</p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow border sticky top-24">
                      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                      <div className="flex justify-between mb-2">
                          <span>Subtotal</span>
                          <span>${total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-4">
                          <span>Shipping</span>
                          <span>Calculated at checkout</span>
                      </div>
                      <div className="border-t pt-4 mb-6">
                          <div className="flex justify-between font-bold text-lg">
                              <span>Total</span>
                              <span>${total.toFixed(2)}</span>
                          </div>
                      </div>
                      <button 
                        onClick={checkout}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                      >
                          {session ? "Proceed to Checkout" : "Login to Checkout"}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}












