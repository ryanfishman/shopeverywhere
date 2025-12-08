import { prisma } from "@/lib/prisma";
import { isPointInPolygon } from "@/lib/geo";
import { removeItemsOutsideZone } from "@/lib/cart";

const OPEN_CART_STATUSES = ["shopping", "shipping"];

export const findZoneForCoordinates = async (lat: number, lng: number) => {
  const zones = await prisma.zone.findMany();

  for (const zone of zones) {
    const coords = zone.coordinates as unknown as Array<{ lat: number; lng: number }>;
    if (Array.isArray(coords) && coords.length > 2 && isPointInPolygon({ lat, lng }, coords)) {
      return {
        zoneId: zone.id,
        zoneName: zone.name,
      };
    }
  }

  return null;
};

const pointInZone = (coords: Array<{ lat: number; lng: number }>, lat?: number | null, lng?: number | null) => {
  if (lat == null || lng == null || !coords?.length) return false;
  return isPointInPolygon({ lat, lng }, coords);
};

export const syncZoneMembership = async (zoneId: string) => {
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { stores: true },
  });

  if (!zone) return;

  const coords = (zone.coordinates as Array<{ lat: number; lng: number }>) || [];
  const allowedStoreIds = zone.stores.map((zs) => zs.storeId);

  if (!coords.length) {
    await prisma.user.updateMany({ where: { zoneId }, data: { zoneId: null } });
    await prisma.shoppingcart.updateMany({
      where: { zoneId, status: { in: OPEN_CART_STATUSES } },
      data: { zoneId: null },
    });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { zoneId },
        {
          AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
        },
      ],
    },
    select: { id: true, latitude: true, longitude: true, zoneId: true },
  });

  await Promise.all(
    users.map((user) => {
      const inside = pointInZone(coords, user.latitude, user.longitude);
      if (inside && user.zoneId !== zoneId) {
        return prisma.user.update({ where: { id: user.id }, data: { zoneId } });
      }
      if (!inside && user.zoneId === zoneId) {
        return prisma.user.update({ where: { id: user.id }, data: { zoneId: null } });
      }
      return Promise.resolve();
    })
  );

  const carts = await prisma.shoppingcart.findMany({
    where: {
      status: { in: OPEN_CART_STATUSES },
      OR: [
        { zoneId },
        {
          AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
        },
      ],
    },
    select: { id: true, latitude: true, longitude: true, zoneId: true },
  });

  for (const cart of carts) {
    const inside = pointInZone(coords, cart.latitude, cart.longitude);
    if (inside) {
      if (cart.zoneId !== zoneId) {
        await prisma.shoppingcart.update({ where: { id: cart.id }, data: { zoneId } });
      }
      await removeItemsOutsideZone(cart.id, allowedStoreIds);
    } else if (!inside && cart.zoneId === zoneId) {
      await prisma.shoppingcart.update({ where: { id: cart.id }, data: { zoneId: null } });
    }
  }
};

