import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: (session.user as any).id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      orderNumber,
      paymentCode,
      items,
      subtotal,
      gst,
      qst,
      total,
      shippingAddress,
      zoneId,
    } = body;

    if (!orderNumber || !paymentCode || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        paymentCode,
        status: "pending_payment",
        subtotal,
        gst,
        qst,
        total,
        shippingAddress: shippingAddress?.address || "",
        shippingCity: shippingAddress?.city || "",
        shippingState: shippingAddress?.state || "",
        shippingPostalCode: shippingAddress?.postalCode || "",
        shippingCountry: shippingAddress?.country || "",
        zoneId: zoneId || null,
        userId: session?.user ? (session.user as any).id : null,
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}









