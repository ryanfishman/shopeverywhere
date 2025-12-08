import { findZoneForCoordinates } from "@/lib/zones";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return new NextResponse("Missing coordinates", { status: 400 });
    }

    const matchedZone = await findZoneForCoordinates(lat, lng);

    if (!matchedZone) {
      return NextResponse.json({ inZone: false });
    }

    return NextResponse.json({ inZone: true, zoneId: matchedZone.zoneId, zoneName: matchedZone.zoneName });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}



