import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(req.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radius = 10; // km

  if (!latParam || !lngParam) {
    return NextResponse.json({ offers: [] });
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);
  const { id } = await params;

  // Find stores in radius
  const allStores = await prisma.store.findMany({
    include: {
      products: {
        where: { productId: id },
      },
    },
  });

  const offers = allStores
    .filter((store) => {
      // Check radius
      const R = 6371;
      const dLat = deg2rad(store.latitude - lat);
      const dLon = deg2rad(store.longitude - lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat)) *
          Math.cos(deg2rad(store.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;

      // Check if store has the product
      const hasProduct = store.products.length > 0;

      return d <= radius && hasProduct;
    })
    .map((store) => ({
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      price: store.products[0].price,
      stock: store.products[0].stock,
      storeProductId: store.products[0].id,
    }));

  // Sort by price
  offers.sort((a, b) => Number(a.price) - Number(b.price));

  return NextResponse.json({ offers });
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
