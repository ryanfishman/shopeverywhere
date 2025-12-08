import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      country: true,
      state: true,
      city: true,
      address: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      zoneId: true,
      zone: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const cart = await prisma.shoppingcart.findFirst({
    where: { userId, status: "shopping" },
    select: { id: true },
  });

  return NextResponse.json({
    user,
    cartId: cart?.id ?? null,
    zone: user?.zone
      ? { inZone: true, zoneId: user.zone.id, zoneName: user.zone.name }
      : user?.zoneId
        ? { inZone: false, zoneId: user.zoneId }
        : null,
  });
}

