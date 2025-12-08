import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = (session.user as any).id;

  // Get active cart
  const cart = await prisma.shoppingcart.findFirst({
    where: {
      userId,
      status: "shopping",
    },
    include: {
      items: {
          include: {
              product: true,
              storeProduct: {
                  include: {
                      store: true
                  }
              }
          }
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return new NextResponse("Cart is empty", { status: 400 });
  }

  if (!cart.zoneId) {
    return NextResponse.json({ error: "Please set a delivery address in a supported zone." }, { status: 400 });
  }

  const allowedStores = await prisma.zonestore.findMany({
    where: { zoneId: cart.zoneId },
    select: { storeId: true },
  });

  const allowedIds = new Set(allowedStores.map((s) => s.storeId));
  if (allowedIds.size === 0) {
    return NextResponse.json({ error: "No stores found for this zone. Please pick a different address." }, { status: 400 });
  }

  const invalidItems = cart.items.filter((item) => !allowedIds.has(item.storeProduct.storeId));
  if (invalidItems.length) {
    await prisma.shoppingcartitem.deleteMany({ where: { id: { in: invalidItems.map((item) => item.id) } } });
    return NextResponse.json({ error: "Some items were removed because they are not available for your zone." }, { status: 409 });
  }

  // Calculate total
  const total = cart.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  if (userRecord && (
        userRecord.address !== cart.address ||
        userRecord.city !== cart.city ||
        userRecord.state !== cart.state ||
        userRecord.country !== cart.country ||
        userRecord.postalCode !== cart.postalCode ||
        userRecord.latitude !== cart.latitude ||
        userRecord.longitude !== cart.longitude ||
        userRecord.zoneId !== cart.zoneId
    )) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                address: cart.address,
                city: cart.city,
                state: cart.state,
                country: cart.country,
                postalCode: cart.postalCode,
                latitude: cart.latitude,
                longitude: cart.longitude,
                zoneId: cart.zoneId,
            },
        });
  }

  // Create Order
  // Start transaction
  try {
      const order = await prisma.$transaction(async (tx) => {
          // 1. Create Order
          const newOrder = await tx.order.create({
              data: {
                  userId,
                  total,
                  status: "shipping", // Direct to shipping as per simplified flow
                  items: {
                      create: cart.items.map((item) => ({
                          productId: item.productId,
                          quantity: item.quantity,
                          price: item.price,
                          storeName: item.storeProduct?.store?.name
                      }))
                  }
              }
          });

          // 2. Mark cart as completed
          await tx.shoppingCart.update({
              where: { id: cart.id },
              data: { status: "completed" }
          });
          
          return newOrder;
      });
      
      return NextResponse.json({ orderId: order.id });

  } catch (e) {
      console.error(e);
      return new NextResponse("Checkout failed", { status: 500 });
  }
}





