import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode";
import { findZoneForCoordinates } from "@/lib/zones";
import { removeItemsOutsideZone } from "@/lib/cart";

type LocationPayload = {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
  cartId?: string;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;
    const payload: LocationPayload = await req.json();

    if (
      !payload.address &&
      !payload.city &&
      !payload.state &&
      !payload.country &&
      !payload.postalCode &&
      (payload.lat === undefined || payload.lng === undefined)
    ) {
      return NextResponse.json({ error: "Address or coordinates required." }, { status: 400 });
    }

    let latitude = payload.lat;
    let longitude = payload.lng;
    let address = payload.address;
    let city = payload.city;
    let state = payload.state;
    let country = payload.country;
    let postalCode = payload.postalCode;

    if (latitude == null || longitude == null) {
      const geocoded = await geocodeAddress({ address, city, state, country, postalCode });
      if (!geocoded) {
        return NextResponse.json({ error: "Unable to geocode address." }, { status: 400 });
      }
      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
      address = geocoded.address || address;
      city = geocoded.city || city;
      state = geocoded.state || state;
      country = geocoded.country || country;
      postalCode = geocoded.postalCode || postalCode;
    } else if (!address || !city || !country) {
      const reverse = await reverseGeocode(latitude, longitude);
      if (reverse) {
        address = address || reverse.address;
        city = city || reverse.city;
        state = state || reverse.state;
        country = country || reverse.country;
        postalCode = postalCode || reverse.postalCode;
      }
    }

    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: "Coordinates missing." }, { status: 400 });
    }

    const cartSelector = payload.cartId
      ? {
          where: {
            id: payload.cartId,
            status: "shopping",
          },
        }
      : undefined;

    let cart =
      (userId &&
      (await prisma.shoppingcart.findFirst({
          where: {
            userId,
            status: "shopping",
          },
        }))) ||
      (cartSelector ? await prisma.shoppingcart.findFirst(cartSelector) : null);

    if (!cart) {
      cart = await prisma.shoppingcart.create({
        data: {
          userId,
          status: "shopping",
        },
      });
    } else if (userId && !cart.userId) {
      cart = await prisma.shoppingcart.update({
        where: { id: cart.id },
        data: { userId },
      });
    }

    const zone = await findZoneForCoordinates(latitude, longitude);

    // Update the current cart
    cart = await prisma.shoppingcart.update({
      where: { id: cart.id },
      data: {
        userId: cart.userId ?? userId,
        country,
        state,
        city,
        address,
        postalCode,
        latitude,
        longitude,
        zoneId: zone?.zoneId ?? null,
      },
    });

    if (userId) {
      // Update user's profile address
      await prisma.user.update({
        where: { id: userId },
        data: {
          country,
          state,
          city,
          address,
          postalCode,
          latitude,
          longitude,
          zoneId: zone?.zoneId ?? null,
        },
      });

      // Update ALL open shopping carts for this user (not pending_payment, paid, or delivered)
      await prisma.shoppingcart.updateMany({
        where: {
          userId,
          status: "shopping",
          id: { not: cart.id }, // Don't update the one we already updated
        },
        data: {
          country,
          state,
          city,
          address,
          postalCode,
          latitude,
          longitude,
          zoneId: zone?.zoneId ?? null,
        },
      });
    }

    let removedItems = 0;
    if (cart.zoneId) {
      const allowedStoreIds = await prisma.zonestore.findMany({
        where: { zoneId: cart.zoneId },
        select: { storeId: true },
      });
      const beforeCount = await prisma.shoppingcartitem.count({ where: { cartId: cart.id } });
      await removeItemsOutsideZone(cart.id, allowedStoreIds.map((s) => s.storeId));
      const afterCount = await prisma.shoppingcartitem.count({ where: { cartId: cart.id } });
      removedItems = Math.max(0, beforeCount - afterCount);
    } else {
      const beforeCount = await prisma.shoppingcartitem.count({ where: { cartId: cart.id } });
      await prisma.shoppingcartitem.deleteMany({ where: { cartId: cart.id } });
      removedItems = beforeCount;
    }

    return NextResponse.json({
      cartId: cart.id,
      location: {
        address: cart.address,
        city: cart.city,
        state: cart.state,
        country: cart.country,
        postalCode: cart.postalCode,
        latitude: cart.latitude,
        longitude: cart.longitude,
      },
      zone: zone
        ? {
            inZone: true,
            zoneId: zone.zoneId,
            zoneName: zone.zoneName,
          }
        : { inZone: false },
      removedItems,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

