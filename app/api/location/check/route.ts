import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode";
import { findZoneForCoordinates } from "@/lib/zones";

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

// Check zone for new location WITHOUT persisting
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

    // Geocode if needed
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

    // Find zone for new coordinates
    const newZone = await findZoneForCoordinates(latitude, longitude);

    // Get current zone from cart or user
    let currentZoneId: string | null = null;
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { zoneId: true },
      });
      currentZoneId = user?.zoneId || null;
    }
    
    if (!currentZoneId && payload.cartId) {
      const cart = await prisma.shoppingcart.findFirst({
        where: { id: payload.cartId, status: "shopping" },
        select: { zoneId: true },
      });
      currentZoneId = cart?.zoneId || null;
    }

    const zoneChanged = currentZoneId !== (newZone?.zoneId ?? null);

    return NextResponse.json({
      location: {
        address,
        city,
        state,
        country,
        postalCode,
        latitude,
        longitude,
      },
      newZone: newZone
        ? {
            inZone: true,
            zoneId: newZone.zoneId,
            zoneName: newZone.zoneName,
          }
        : { inZone: false },
      currentZoneId,
      zoneChanged,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}




