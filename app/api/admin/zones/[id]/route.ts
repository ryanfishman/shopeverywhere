import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { syncZoneMembership } from "@/lib/zones";
import { normalizeTranslations } from "@/lib/i18n";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const zone = await prisma.zone.findUnique({
    where: { id },
    include: {
      stores: {
        include: { store: true },
      },
    },
  });

  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const allStores = await prisma.store.findMany();
  const stores = allStores.map((store) => ({
    id: store.id,
    name: store.name,
    nameTranslations: store.nameTranslations,
    latitude: store.latitude,
    longitude: store.longitude,
    address: store.address,
    city: store.city,
    inZone: zone.stores.some((zs) => zs.storeId === store.id),
  }));

  const users = await prisma.user.findMany({
    where: { zoneId: zone.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
    },
  });

  const userIds = users.map((u) => u.id);
  const cartsByUser = await prisma.shoppingcart.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, status: true },
  });

  const userStats = userIds.reduce<Record<string, { open: number; completed: number }>>((acc, id) => {
    acc[id] = { open: 0, completed: 0 };
    return acc;
  }, {});

  cartsByUser.forEach((cart) => {
    if (!userStats[cart.userId!]) {
      userStats[cart.userId!] = { open: 0, completed: 0 };
    }
    if (cart.status === "completed" || cart.status === "delivered") {
      userStats[cart.userId!].completed += 1;
    } else {
      userStats[cart.userId!].open += 1;
    }
  });

  return NextResponse.json({
    zone: {
      id: zone.id,
      name: zone.name,
      nameTranslations: zone.nameTranslations,
      coordinates: zone.coordinates,
    },
    stores,
    users: users.map((user) => ({
      ...user,
      openCarts: userStats[user.id]?.open ?? 0,
      completedCarts: userStats[user.id]?.completed ?? 0,
    })),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const body = await req.json();
  const { name, translations, coordinates } = body;
  
  const normalizedTranslations = translations ? normalizeTranslations(translations) : undefined;

  const zone = await prisma.zone.update({
    where: { id },
    data: {
      name: normalizedTranslations?.en || name?.trim(),
      nameTranslations: normalizedTranslations,
      coordinates,
    },
  });

  await syncZoneMembership(id);

  return NextResponse.json(zone);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;

  // Check if zone exists first
  const zone = await prisma.zone.findUnique({ where: { id } });
  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  // Clean up related records first, then delete the zone
  await prisma.zonestore.deleteMany({ where: { zoneId: id } });
  await prisma.user.updateMany({ where: { zoneId: id }, data: { zoneId: null } });
  await prisma.shoppingcart.updateMany({ where: { zoneId: id }, data: { zoneId: null } });
  await prisma.zone.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
