"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
            const data = await res.json();
            setOrders(data.orders);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Order Placed</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-medium">${Number(order.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize text-indigo-600">{order.status}</p>
              </div>
            </div>
            <div className="p-6">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 mb-4 last:mb-0">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image src={item.product?.imageUrl || "https://placehold.co/100"} alt={item.product?.name} fill className="object-cover rounded" />
                  </div>
                  <div>
                    <h4 className="font-bold">{item.product?.name}</h4>
                    <p className="text-sm text-gray-500">{item.storeName}</p>
                    <p className="text-sm">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}












