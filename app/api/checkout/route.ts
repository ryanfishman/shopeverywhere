import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// Tax rates for Quebec, Canada
const GST_RATE = 0.05;
const QST_RATE = 0.09975;

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SE-${timestamp}-${random}`;
}

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

  // Check for expired products (validUntil <= current date)
  const now = new Date();
  const expiredItems = cart.items.filter((item) => item.product.validUntil && item.product.validUntil <= now);
  
  if (expiredItems.length > 0) {
    // Remove expired items from cart
    await prisma.shoppingcartitem.deleteMany({ 
      where: { id: { in: expiredItems.map((item) => item.id) } } 
    });
    
    // Return info about removed items so user can decide to continue
    const removedProducts = expiredItems.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
    }));
    
    return NextResponse.json({ 
      error: "Some items have expired and were removed from your cart.",
      expiredItems: removedProducts,
      requiresConfirmation: true
    }, { status: 409 });
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

  // Calculate totals with taxes
  const subtotal = cart.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const gst = subtotal * GST_RATE;
  const qst = subtotal * QST_RATE;
  const total = subtotal + gst + qst;

  // Generate order identifiers server-side
  const orderNumber = generateOrderNumber();
  const paymentCode = generateOrderCode();

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
                  orderNumber,
                  paymentCode,
                  userId,
                  subtotal,
                  gst,
                  qst,
                  total,
                  status: "pending_payment",
                  shippingAddress: cart.address || "",
                  shippingCity: cart.city || "",
                  shippingState: cart.state || "",
                  shippingPostalCode: cart.postalCode || "",
                  shippingCountry: cart.country || "",
                  zoneId: cart.zoneId,
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
          await tx.shoppingcart.update({
              where: { id: cart.id },
              data: { status: "completed" }
          });
          
          return newOrder;
      });
      
      return NextResponse.json({ 
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentCode: order.paymentCode,
        total: order.total,
        subtotal: order.subtotal,
        gst: order.gst,
        qst: order.qst
      });

  } catch (e) {
      console.error(e);
      return new NextResponse("Checkout failed", { status: 500 });
  }
}





