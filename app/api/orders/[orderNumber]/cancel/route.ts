import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const session = await getServerSession(authOptions);

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        ...(session?.user ? { userId: (session.user as any).id } : {}),
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Order cannot be cancelled" },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}

